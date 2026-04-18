export const AUTH_COOKIE_NAME = "mk_session";
export const AUTH_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const TRIAL_DAYS = 15;

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export const API_RATE_LIMIT = {
  LOGIN_ATTEMPTS: 5,
  LOGIN_WINDOW_SECONDS: 60,
  REGISTER_ATTEMPTS: 3,
  REGISTER_WINDOW_SECONDS: 60,
};

export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
};

export const CSRF_COOKIE_NAME = "mk_csrf";
export const CSRF_HEADER_NAME = "x-csrf-token";

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
};

export const SECURITY = {
  REQUEST_SIZE_LIMIT: "1mb",
  CORS_ORIGINS: process.env.ALLOWED_ORIGINS?.split(",") || [],
};
