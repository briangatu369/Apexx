import EventEmitter from "events";
import SOCKET_EVENT_NAMES from "../../config/socketEventNamesConfig";
import GameSessionManager, { SingleBet } from "./gameSessionManager";
import BettingQueueManager from "./bettingQueueManager";
import { Server, Socket } from "socket.io";
import { GAME_SESSION_EVENT_NAMES } from "../../config/eventNamesConfig";
import { GamePhase } from "../../models/game/gameSessionAnalytics";
import { BettingError } from "../../utils/errors/bettingError";
import { CashoutError } from "../../utils/errors/cashoutError";
import {
  BettingPayload,
  CashoutPayload,
  validateBetPayload,
  validateCashoutPayload,
} from "../../validations/bettingRequestValidations";
import BettingManager, {
  BettingDataToProcess,
  CashoutDataToProcess,
} from "./bettingManager";

export interface PreviousMultiplier {
  finalMultiplier: number;
  sessionId: string;
}

class GameManager {
  gameSession: GameSessionManager;
  private gameEventEmitter: EventEmitter;
  private previousMultipliers: PreviousMultiplier[];
  private bettingManager: BettingManager;
  private queuesManager: BettingQueueManager;

  constructor(io: Server) {
    this.previousMultipliers = [];
    this.gameEventEmitter = new EventEmitter();

    this.gameSession = new GameSessionManager({
      io,
      gameEventEmitter: this.gameEventEmitter,
    });
    this.bettingManager = new BettingManager({ gameSession: this.gameSession });
    this.queuesManager = new BettingQueueManager({
      bettingManager: this.bettingManager,
      gameEventEmitter: this.gameEventEmitter,
      gameSession: this.gameSession,
    });

    this.gameEventEmitter.on(
      GAME_SESSION_EVENT_NAMES.sessionEnd,
      (previousMultipliers) => {
        if (this.previousMultipliers.length > 15) {
          this.previousMultipliers.pop();
        }
        this.previousMultipliers.unshift(previousMultipliers);
      }
    );
  }

  onConnectionData() {
    return {
      bets: this.gameSession.getCurrentBets().bets,
      previousMultipliers: this.previousMultipliers,
    };
  }

  startGameSession() {
    this.gameSession.startGameSession();
  }

  async handlePlaceBet(socket: Socket, bettingPayload: BettingPayload) {
    try {
      const currentGamePhase = this.gameSession.getGamePhase();
      if (currentGamePhase.gamePhase !== GamePhase.BETTING) {
        throw new BettingError({
          description:
            "Cannot place bet when the game is not in the betting phase",
        });
      }

      validateBetPayload(bettingPayload);

      const bettingDataToProcess: BettingDataToProcess = {
        stake: bettingPayload.stake,
        userId: bettingPayload.userId,
      };

      const result = await this.queuesManager.addBetToQueueAndProcess(
        bettingDataToProcess
      );

      const playerSessionData: SingleBet = {
        stake: result.stake,
        cashoutMultiplier: null,
        payout: null,
        userId: result.userId,
        username: result.username,
      };

      this.gameSession.addPlayerToSession(playerSessionData);
      this.gameSession.updateSessionClientSeed({
        clientSeed: result.clientSeed,
        username: result.username,
      });

      socket.emit(
        `${SOCKET_EVENT_NAMES.emitters.game.betting.placebetSuccess}${bettingPayload.buttonId}`,
        {
          betId: result.betId,
          accountBalance: result.accountBalance,
        }
      );
    } catch (err) {
      socket.emit(
        `${SOCKET_EVENT_NAMES.emitters.game.betting.placebetError}${bettingPayload.buttonId}`,
        { errorMessage: err?.message }
      );
    }
  }

  async handleCashout(socket: Socket, cashoutPayload: CashoutPayload) {
    try {
      const currentGamePhase = this.gameSession.getGamePhase().gamePhase;
      if (currentGamePhase !== GamePhase.RUNNING) {
        throw new CashoutError({
          description: "Stage time out",
        });
      }

      validateCashoutPayload(cashoutPayload);

      const cashoutMultiplier = +this.gameSession
        .getCurrentMultiplier()
        .currentMultiplier.toFixed(2);

      const cashoutDataToProcess: CashoutDataToProcess = {
        cashoutMultiplier,
        betId: cashoutPayload.betId,
      };

      const result = await this.queuesManager.addCashoutToQueueAndProcess(
        cashoutDataToProcess
      );

      socket.emit(
        `${SOCKET_EVENT_NAMES.emitters.game.betting.cashoutSuccess}${cashoutPayload.buttonId}`,
        {
          cashoutMultiplier: result.cashoutMultiplier,
          payout: result.payout,
          accountBalance: result.accountBalance,
        }
      );
    } catch (err) {
      console.error(err);

      socket.emit(
        `${SOCKET_EVENT_NAMES.emitters.game.betting.cashoutError}${cashoutPayload.buttonId}`,
        { errorMessage: err?.message }
      );
    }
  }
}

export default GameManager;
