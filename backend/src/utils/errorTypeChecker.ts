import { AppError } from "./errors/appError";

export function isSpecificError<T extends AppError>(
  err: unknown,
  ErrorClass: new (...args: any[]) => T
): err is T {
  return err instanceof ErrorClass;
}
