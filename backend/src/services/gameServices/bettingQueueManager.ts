import EventEmitter from "events";
import BettingManager, {
  BettingDataToProcess,
  CashoutDataToProcess,
} from "./bettingManager";
import GameSessionManager from "./gameSessionManager";
import { GAME_SESSION_EVENT_NAMES } from "../../config/eventNamesConfig";
import { BettingError } from "../../utils/errors/bettingError";

interface QueueItem<T> {
  payload: T;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

interface InMemoryQueuesI {
  bettingQueue: QueueItem<BettingDataToProcess>[];
  cashoutQueue: QueueItem<CashoutDataToProcess>[];
  isProcessingBets: boolean;
  isProcessingCashouts: boolean;
}

class BettingQueueManager {
  // Maximum number of items allowed in queue to prevent system overload
  private static MAX_QUEUE_SIZE = 1000;

  private queues: InMemoryQueuesI;
  private bettingManager: BettingManager;
  private gameEventEmitter: EventEmitter;
  private gameSession: GameSessionManager;

  constructor({
    bettingManager,
    gameEventEmitter,
    gameSession,
  }: {
    bettingManager: BettingManager;
    gameEventEmitter: EventEmitter;
    gameSession: GameSessionManager;
  }) {
    this.gameSession = gameSession;
    this.bettingManager = bettingManager;
    this.gameEventEmitter = gameEventEmitter;
    this.queues = {
      bettingQueue: [],
      cashoutQueue: [],
      isProcessingBets: false,
      isProcessingCashouts: false,
    };
  }

  async addBetToQueueAndProcess(
    bettingDataToProcess: BettingDataToProcess
  ): Promise<any> {
    // Ensure queue hasn't reached maximum capacity
    this.validateQueueSize(this.queues.bettingQueue);

    return new Promise((resolve, reject) => {
      // Add bet to queue
      this.enqueue(this.queues.bettingQueue, {
        payload: bettingDataToProcess,
        resolve,
        reject,
      });

      // Start processing queue if not already in progress
      if (!this.queues.isProcessingBets) {
        this.gameEventEmitter.emit(GAME_SESSION_EVENT_NAMES.bettingStarted);
        this.processBets();
      }
    });
  }

  private async processBets(): Promise<void> {
    // Skip if already processing or queue is empty
    if (this.queues.isProcessingBets || this.queues.bettingQueue.length === 0) {
      return;
    }

    // Lock queue to prevent concurrent processing
    this.queues.isProcessingBets = true;

    try {
      // Process all bets in queue sequentially
      while (this.queues.bettingQueue.length > 0) {
        const { payload, resolve, reject } = this.queues.bettingQueue[0];
        try {
          const result = await this.bettingManager.placeBet(payload);
          this.dequeue(this.queues.bettingQueue);
          resolve(result);
        } catch (err) {
          this.dequeue(this.queues.bettingQueue);
          reject(err);
        }
      }
    } finally {
      // Unlock queue processing
      this.gameEventEmitter.emit(GAME_SESSION_EVENT_NAMES.bettingComplete);

      this.queues.isProcessingBets = false;
    }
  }

  async addCashoutToQueueAndProcess(
    cashoutDataToProcess: CashoutDataToProcess
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.enqueue(this.queues.cashoutQueue, {
        payload: cashoutDataToProcess,
        resolve,
        reject,
      });

      // Start processing queue if not already in progress
      if (!this.queues.isProcessingCashouts) {
        this.gameEventEmitter.emit(GAME_SESSION_EVENT_NAMES.cashoutStart);
        this.processCashouts();
      }
    });
  }

  private async processCashouts(): Promise<void> {
    // Skip if already processing or queue is empty
    if (
      this.queues.isProcessingCashouts ||
      this.queues.cashoutQueue.length === 0
    ) {
      return;
    }

    // Lock queue to prevent concurrent processing
    this.queues.isProcessingCashouts = true;

    try {
      // Process all cashouts in queue sequentially
      while (this.queues.cashoutQueue.length > 0) {
        const { payload, resolve, reject } = this.queues.cashoutQueue[0];
        try {
          // Attempt to process cashout
          const result = await this.bettingManager.cashout(payload);
          this.dequeue(this.queues.cashoutQueue);
          resolve(result);
        } catch (err) {
          this.dequeue(this.queues.cashoutQueue);
          reject(err);
        }
      }
    } finally {
      // Unlock queue processing
      this.gameEventEmitter.emit(GAME_SESSION_EVENT_NAMES.cashoutComplete);
      this.queues.isProcessingCashouts = false;
    }
  }

  private enqueue<T>(queue: QueueItem<T>[], item: QueueItem<T>): void {
    queue.push(item);
  }

  private dequeue<T>(queue: QueueItem<T>[]): QueueItem<T> | undefined {
    return queue.shift();
  }

  // Prevent queue from exceeding maximum size
  private validateQueueSize(queue: any[]) {
    if (queue.length >= BettingQueueManager.MAX_QUEUE_SIZE) {
      throw new BettingError({
        internalDetails: `Queue capacity exceeded. Current queue size: ${queue.length}`,
      });
    }
  }
}

export default BettingQueueManager;
