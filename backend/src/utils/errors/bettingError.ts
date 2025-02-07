import { AppError, AppErrorOptions } from "./appError";

class BettingError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super({
      name: "BettingError",
      httpCode: 400,
      description: "Unable to process your bet",
      ...options,
    });
  }
}

export { BettingError };
