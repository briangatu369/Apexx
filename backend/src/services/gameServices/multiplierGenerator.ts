import crypto from "crypto";
import GAME_CONFIG from "../../config/gameConfig";
import GameError from "../../utils/errors/gameError";

interface MultiplierInfo {
  readonly serverSeed: string | null;
  readonly hashedServerSeed: string | null;
  readonly gameHash: string | null;
  readonly rawCrashPoint: number | null;
  readonly finalCrashPoint: number | null;
}

interface CrashPointRange {
  readonly min: number;
  readonly max: number | null;
  readonly label: string;
}

interface SimulationResult {
  numRounds: number;
  distribution: Record<string, number>;
  crashPoints: number[];
  statistics: {
    average: number;
    median: number;
    min: number;
    max: number;
    variance: number;
    standardDeviation: number;
  };
}

class MultiplierGenerator {
  private static readonly SLICE_HEX_LENGTH = 2;

  private static readonly CRASH_POINT_RANGES: CrashPointRange[] = [
    { min: 1, max: 2, label: "1-2x" },
    { min: 2, max: 3, label: "2-3x" },
    { min: 3, max: 5, label: "3-5x" },
    { min: 5, max: 10, label: "5-10x" },
    { min: 10, max: 20, label: "10-20x" },
    { min: 20, max: 50, label: "20-50x" },
    { min: 50, max: 100, label: "50-100x" },
    { min: 100, max: null, label: "100x+" },
  ];

  multiplierData: MultiplierInfo = this.initializeGameData();

  private initializeGameData(): MultiplierInfo {
    return {
      serverSeed: null,
      hashedServerSeed: null,
      gameHash: null,
      rawCrashPoint: null,
      finalCrashPoint: null,
    };
  }

  generateServerSeed(): { serverSeed: string; hashedServerSeed: string } {
    try {
      const serverSeed = crypto.randomBytes(33).toString("base64");
      const hashedServerSeed = crypto
        .createHash("sha256")
        .update(serverSeed)
        .digest("hex");

      this.multiplierData = {
        ...this.multiplierData,
        serverSeed,
        hashedServerSeed,
      };

      return { serverSeed, hashedServerSeed };
    } catch (error) {
      throw new GameError({
        internalDetails: "Failed to generate server seed",
        isOperational: false,
      });
    }
  }

  generateGameHash(clientSeed: string): string {
    try {
      if (!clientSeed?.trim()) {
        throw new GameError({
          internalDetails: "Client seed was not provided",
          isOperational: true,
        });
      }

      if (!this.multiplierData.serverSeed) {
        throw new GameError({
          internalDetails: "Server seed must be generated before game hash",
          isOperational: false,
        });
      }

      const combinedSeeds = `${this.multiplierData.serverSeed}${clientSeed}`;
      const gameHash = crypto
        .createHash("sha256")
        .update(combinedSeeds)
        .digest("hex");

      this.multiplierData = {
        ...this.multiplierData,
        gameHash,
      };

      return gameHash;
    } catch (error) {
      throw error;
    }
  }

  calculateCrashPoint(): number {
    const { SLICE_HEX_LENGTH } = MultiplierGenerator;

    const numBytes = SLICE_HEX_LENGTH / 2;
    const totalBits = numBytes * 8;
    const maxHashValue = 2 ** totalBits - 1;

    const hashSubstring = this.multiplierData.gameHash!.substring(
      0,
      SLICE_HEX_LENGTH
    );

    const randomValue = parseInt(hashSubstring, 16) / maxHashValue;

    let rawCrashPoint = 1 / (1 - randomValue);
    rawCrashPoint = +Math.min(
      GAME_CONFIG.MAX_CRASH_POINT,
      Math.max(1, rawCrashPoint)
    ).toFixed(2);

    const finalCrashPoint = +(
      rawCrashPoint *
      (1 - GAME_CONFIG.HOUSE_EDGE)
    ).toFixed(2);

    this.multiplierData = {
      ...this.multiplierData,
      rawCrashPoint,
      finalCrashPoint,
    };

    return finalCrashPoint;
  }

  getMultiplierData(): MultiplierInfo {
    return this.multiplierData;
  }

  resetMultiplierData(): void {
    this.multiplierData = this.initializeGameData();
  }

  simulateRounds(numRounds: number, clientSeed?: string): SimulationResult {
    try {
      if (!Number.isInteger(numRounds) || numRounds <= 0) {
        throw new GameError({
          internalDetails: "Number of rounds must be a positive integer",
        });
      }

      const crashPoints: number[] = [];
      const distribution: Record<string, number> = Object.fromEntries(
        MultiplierGenerator.CRASH_POINT_RANGES.map((range) => [range.label, 0])
      );

      const defaultClientSeed = crypto.randomBytes(32).toString("hex");
      const finalClientSeed = clientSeed || defaultClientSeed;

      for (let i = 0; i < numRounds; i++) {
        this.generateServerSeed();
        this.generateGameHash(finalClientSeed);
        const crashPoint = this.calculateCrashPoint();
        crashPoints.push(crashPoint);

        const range = MultiplierGenerator.CRASH_POINT_RANGES.find(
          (range) =>
            crashPoint >= range.min &&
            (range.max === null || crashPoint < range.max)
        );
        if (range) {
          distribution[range.label]++;
        }
      }

      Object.keys(distribution).forEach((key) => {
        distribution[key] = +((distribution[key] / numRounds) * 100).toFixed(2);
      });

      const sortedCrashPoints = [...crashPoints].sort((a, b) => a - b);

      return {
        numRounds,
        distribution,
        crashPoints: sortedCrashPoints,
        statistics: this.calculateStatistics(sortedCrashPoints),
      };
    } catch (error) {
      throw error;
    }
  }

  private calculateStatistics(
    crashPoints: number[]
  ): SimulationResult["statistics"] {
    const sum = crashPoints.reduce((a, b) => a + b, 0);
    const average = +(sum / crashPoints.length).toFixed(2);

    const squaredDiffs = crashPoints.map((point) =>
      Math.pow(point - average, 2)
    );
    const variance = +(
      squaredDiffs.reduce((a, b) => a + b) / crashPoints.length
    ).toFixed(2);
    const standardDeviation = +Math.sqrt(variance).toFixed(2);

    return {
      average,
      median: +crashPoints[Math.floor(crashPoints.length / 2)].toFixed(2),
      min: +Math.min(...crashPoints).toFixed(2),
      max: +Math.max(...crashPoints).toFixed(2),
      variance,
      standardDeviation,
    };
  }
}

export default MultiplierGenerator;
