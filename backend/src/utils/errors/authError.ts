import { AppError, AppErrorOptions } from "./appError";

class AuthError extends AppError {
  constructor({}: AppErrorOptions = {}) {
    super({ name: "AuthError" });
  }
}

export default AuthError;
