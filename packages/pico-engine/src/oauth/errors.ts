export class OAuthError extends Error {
  statusCode: number;
  oauthError: string;
  constructor(message: string, oauthError: string, statusCode = 400) {
    super(message);
    this.name = "OAuthError";
    this.oauthError = oauthError;
    this.statusCode = statusCode;
  }
}
