class InternalServerError extends Error {
  code: number;

  constructor(message: string) {
    super(message);
    this.code = 500;
  }
}

export default InternalServerError;
