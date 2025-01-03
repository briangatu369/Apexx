class InvalidDataError extends Error {
  code: number;

  constructor(message: string) {
    super(message);

    this.code = 400;
  }
}

export default InvalidDataError;
