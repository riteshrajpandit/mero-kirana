export class AuthError extends Error {
  public readonly code: string;
  
  constructor(
    message = "Unauthorized",
    public readonly statusCode = 401,
    code = "AUTHENTICATION_ERROR",
  ) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}