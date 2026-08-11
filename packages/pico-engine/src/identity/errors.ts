export class IdentityError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "IdentityError";
    this.statusCode = statusCode;
  }
}
