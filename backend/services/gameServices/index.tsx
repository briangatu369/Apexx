import crypto from "crypto";
import InternalServerError from "../../utils/errors/internalServerError";

class UserServices {
  private static readonly MAX_MULTIPLIER = 10000;
  private static readonly HOUSE_EDGE = 0.01;
  private static readonly PREFIX_LENGTH = 8;
  private static readonly MULTIPLIER_TUNING_FACTOR = 0.8;

  private multiplierData: {
    serverSeed: string | null;
    hashedServerSeed: string | null;
    gameSessionHash: string | null;
    multiplier: number | null;
    finalMultiplier: number | null;
  } = {
    serverSeed: null,
    hashedServerSeed: null,
    gameSessionHash: null,
    multiplier: null,
    finalMultiplier: null,
  };

  generateServerSeed(): { serverSeed: string; hashedServerSeed: string } {
    const serverSeed = crypto.randomBytes(32).toString("hex");
    const hashedServerSeed = crypto
      .createHash("sha256")
      .update(serverSeed)
      .digest("hex");

    this.multiplierData.serverSeed = serverSeed;
    this.multiplierData.hashedServerSeed = hashedServerSeed;

    return { serverSeed, hashedServerSeed };
  }

  generateGameHash(clientSeed: string): string {
    if (!this.multiplierData.serverSeed) {
      throw new InternalServerError("Server seed was not generated.");
    }

    if (!clientSeed) {
      throw new InternalServerError("Client seed was not generated.");
    }

    const combinedSeeds = this.multiplierData.serverSeed + clientSeed;
    const gameSessionHash = crypto
      .createHash("sha256")
      .update(combinedSeeds)
      .digest("hex");

    this.multiplierData.gameSessionHash = gameSessionHash;
    return gameSessionHash;
  }

  calculateMultiplier(): number {
    if (!this.multiplierData.gameSessionHash) {
      throw new Error("Game session hash is not generated. Generate it first.");
    }

    const {
      MAX_MULTIPLIER,
      HOUSE_EDGE,
      PREFIX_LENGTH,
      MULTIPLIER_TUNING_FACTOR,
    } = UserServices;
    const maxNumericValue = 2 ** ((PREFIX_LENGTH / 2) * 8) - 1;

    const hashPrefix = this.multiplierData.gameSessionHash.substring(
      0,
      PREFIX_LENGTH
    );
    const normalizedDecimal = parseInt(hashPrefix, 16) / maxNumericValue;

    let multiplier = 1 / normalizedDecimal ** MULTIPLIER_TUNING_FACTOR;

    if (normalizedDecimal === 0 || !Number.isFinite(multiplier)) {
      multiplier = MAX_MULTIPLIER;
    }

    const finalMultiplier = multiplier * (1 - HOUSE_EDGE);

    this.multiplierData.multiplier = multiplier;
    this.multiplierData.finalMultiplier = finalMultiplier;

    return +Math.min(MAX_MULTIPLIER, Math.max(1, finalMultiplier)).toFixed(2);
  }

  simulateMultipliers(rounds: number) {
    if (rounds <= 0) {
      throw new Error("Number of rounds must be greater than zero.");
    }

    const results: number[] = [];
    const distribution: Record<string, number> = {
      "1-2x": 0,
      "2-3x": 0,
      "3-5x": 0,
      "5-10x": 0,
      "10-20x": 0,
      "20-50x": 0,
      "50-100x": 0,
      "100x+": 0,
    };

    for (let i = 0; i < rounds; i++) {
      const { serverSeed } = this.generateServerSeed();
      this.generateGameHash(serverSeed);
      const multiplier = this.calculateMultiplier();
      results.push(multiplier);

      if (multiplier < 2) distribution["1-2x"]++;
      else if (multiplier < 3) distribution["2-3x"]++;
      else if (multiplier < 5) distribution["3-5x"]++;
      else if (multiplier < 10) distribution["5-10x"]++;
      else if (multiplier < 20) distribution["10-20x"]++;
      else if (multiplier < 50) distribution["20-50x"]++;
      else if (multiplier < 100) distribution["50-100x"]++;
      else distribution["100x+"]++;
    }

    Object.keys(distribution).forEach((key) => {
      distribution[key] = +((distribution[key] / rounds) * 100).toFixed(2);
    });

    const sortedResults = [...results].sort((a, b) => a - b);

    return {
      rounds,
      distribution,
      results,
      average: +(results.reduce((a, b) => a + b, 0) / rounds).toFixed(2),
      median: +sortedResults[Math.floor(rounds / 2)].toFixed(2),
      min: +Math.min(...results).toFixed(2),
      max: +Math.max(...results).toFixed(2),
    };
  }
}

export default UserServices;
