import { AppError, AppErrorOptions } from "./appError";

class GameError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super({
      name: "GameError",
      httpCode: 500,
      description: "Unexpected error occured",
      ...options,
    });
  }
}

export default GameError;
