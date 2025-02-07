import { AppError, AppErrorOptions } from "./appError";

class CashoutError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super({
      name: "CashoutError",
      httpCode: 400,
      description: "Unable to process cashout",
      ...options,
    });
  }
}

export { CashoutError };
