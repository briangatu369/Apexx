export interface AppErrorOptions {
  name?: string;
  httpCode?: number;
  description?: string;
  isOperational?: boolean;
  internalDetails?: string;
}

class AppError extends Error {
  public readonly name: string;
  public readonly httpCode: number;
  public readonly description: string;
  public readonly isOperational: boolean;
  public readonly internalDetails?: string;

  constructor(options: AppErrorOptions = {}) {
    const {
      name = "AppError",
      httpCode = 500,
      description = "An unexpected error occurred",
      isOperational = true,
      internalDetails,
    } = options;

    super(description);

    this.name = name;
    this.httpCode = httpCode;
    this.description = description;
    this.isOperational = isOperational;
    this.internalDetails = internalDetails;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export { AppError };
