export class AuthError extends Error {
  constructor(
    message = "Unauthorized",
    public readonly statusCode = 401,
  ) {
    super(message);
    this.name = "AuthError";
  }
}