import crypto from "crypto";
import InternalServerError from "../../utils/errors/internalServerError";

/**
 * Represents the immutable state data for a multiplier game session
 */
interface MultiplierData {
  readonly serverSeed: string | null;
  readonly hashedServerSeed: string | null;
  readonly gameSessionHash: string | null;
  readonly multiplier: number | null;
  readonly finalMultiplier: number | null;
}

/**
 * Represents ranges for multiplier distribution analysis
 */
interface MultiplierRange {
  readonly min: number;
  readonly max: number | null;
  readonly label: string;
}

/**
 * Generator class for creating provably fair multipliers with house edge
 */
class MultiplierGenerator {
  private static readonly MAX_MULTIPLIER = 10000;
  private static readonly HOUSE_EDGE = 0.01;
  private static readonly PREFIX_LENGTH = 8;
  private static readonly MULTIPLIER_TUNING_FACTOR = 0.8; // Controls result curve steepness

  private static readonly DISTRIBUTION_RANGES: MultiplierRange[] = [
    { min: 1, max: 2, label: "1-2x" },
    { min: 2, max: 3, label: "2-3x" },
    { min: 3, max: 5, label: "3-5x" },
    { min: 5, max: 10, label: "5-10x" },
    { min: 10, max: 20, label: "10-20x" },
    { min: 20, max: 50, label: "20-50x" },
    { min: 50, max: 100, label: "50-100x" },
    { min: 100, max: null, label: "100x+" },
  ];

  multiplierData: MultiplierData = {
    serverSeed: null,
    hashedServerSeed: null,
    gameSessionHash: null,
    multiplier: null,
    finalMultiplier: null,
  };

  /**
   * Generates a random server seed and its SHA-256 hash
   * @returns Object containing the server seed and its hash
   */
  generateServerSeed(): { serverSeed: string; hashedServerSeed: string } {
    const serverSeed = crypto.randomBytes(32).toString("hex");
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
  }

  /**
   * Generates a game hash from server seed and client seed
   * @param clientSeed - Client-provided seed for additional randomness
   * @throws {InternalServerError} If seeds are not properly generated
   * @returns The generated game hash
   */
  generateGameHash(clientSeed: string): string {
    if (!this.multiplierData.serverSeed) {
      throw new InternalServerError(
        "Server seed must be generated before game hash"
      );
    }

    if (!clientSeed?.trim()) {
      throw new InternalServerError("Client seed must be a non-empty string");
    }

    const combinedSeeds = `${this.multiplierData.serverSeed}${clientSeed}`;
    const gameSessionHash = crypto
      .createHash("sha256")
      .update(combinedSeeds)
      .digest("hex");

    this.multiplierData = {
      ...this.multiplierData,
      gameSessionHash,
    };

    return gameSessionHash;
  }

  getMultiplierData() {
    return this.multiplierData;
  }

  /**
   * Calculates the raw multiplier value from the game hash
   * @returns Normalized multiplier between 0 and MAX_MULTIPLIER
   */
  private calculateRawMultiplier(): number {
    const { MAX_MULTIPLIER, PREFIX_LENGTH, MULTIPLIER_TUNING_FACTOR } =
      MultiplierGenerator;
    const maxNumericValue = 2 ** ((PREFIX_LENGTH / 2) * 8) - 1;

    const hashPrefix = this.multiplierData.gameSessionHash!.substring(
      0,
      PREFIX_LENGTH
    );
    const normalizedDecimal = parseInt(hashPrefix, 16) / maxNumericValue;

    let multiplier = 1 / normalizedDecimal ** MULTIPLIER_TUNING_FACTOR;

    return normalizedDecimal === 0 || !Number.isFinite(multiplier)
      ? MAX_MULTIPLIER
      : multiplier;
  }

  /**
   * Applies house edge and limits to the raw multiplier
   * @param rawMultiplier - The calculated raw multiplier
   * @returns Final multiplier with house edge applied
   */
  private applyHouseEdgeAndLimits(rawMultiplier: number): number {
    const { MAX_MULTIPLIER, HOUSE_EDGE } = MultiplierGenerator;

    const withHouseEdge = rawMultiplier * (1 - HOUSE_EDGE);
    return +Math.min(MAX_MULTIPLIER, Math.max(1, withHouseEdge)).toFixed(2);
  }

  /**
   * Calculates the final multiplier for the current game session
   * @throws {InternalServerError} If game hash is not generated
   * @returns The final multiplier value
   */
  calculateMultiplier(): number {
    if (!this.multiplierData.gameSessionHash) {
      throw new InternalServerError(
        "Game hash must be generated before calculating multiplier"
      );
    }

    const rawMultiplier = this.calculateRawMultiplier();
    const finalMultiplier = this.applyHouseEdgeAndLimits(rawMultiplier);

    this.multiplierData = {
      ...this.multiplierData,
      multiplier: rawMultiplier,
      finalMultiplier,
    };

    return finalMultiplier;
  }

  /**
   * Simulates multiple rounds and provides statistical analysis
   * @param rounds - Number of rounds to simulate
   * @throws {Error} If rounds is not a positive number
   * @returns Statistical analysis of the simulation
   */
  simulateMultipliers(rounds: number) {
    if (!Number.isInteger(rounds) || rounds <= 0) {
      throw new Error("Rounds must be a positive integer");
    }

    const results: number[] = [];
    const distribution: Record<string, number> = Object.fromEntries(
      MultiplierGenerator.DISTRIBUTION_RANGES.map((range) => [range.label, 0])
    );

    for (let i = 0; i < rounds; i++) {
      const { serverSeed } = this.generateServerSeed();
      this.generateGameHash(serverSeed);
      const multiplier = this.calculateMultiplier();
      results.push(multiplier);

      const range = MultiplierGenerator.DISTRIBUTION_RANGES.find(
        (range) =>
          multiplier >= range.min &&
          (range.max === null || multiplier < range.max)
      );
      if (range) {
        distribution[range.label]++;
      }
    }

    // Convert counts to percentages
    Object.keys(distribution).forEach((key) => {
      distribution[key] = +((distribution[key] / rounds) * 100).toFixed(2);
    });

    const sortedResults = [...results].sort((a, b) => a - b);

    return {
      rounds,
      distribution,
      results,
      statistics: {
        average: +(results.reduce((a, b) => a + b, 0) / rounds).toFixed(2),
        median: +sortedResults[Math.floor(rounds / 2)].toFixed(2),
        min: +Math.min(...results).toFixed(2),
        max: +Math.max(...results).toFixed(2),
      },
    };
  }
}

export default MultiplierGenerator;
