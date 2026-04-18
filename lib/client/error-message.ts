type ErrorShape = {
  message?: unknown;
  code?: unknown;
  details?: unknown;
};

type ErrorPayload = {
  error?: unknown;
};

function firstValidationDetail(details: unknown): string | null {
  if (!details || typeof details !== "object") {
    return null;
  }

  const record = details as Record<string, unknown>;

  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      const first = value[0];
      if (typeof first === "string" && first.length > 0) {
        return first;
      }
    }
  }

  return null;
}

export function getErrorMessage(
  payload: unknown,
  fallback: string,
): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const maybePayload = payload as ErrorPayload;

  if (typeof maybePayload.error === "string") {
    return maybePayload.error;
  }

  if (maybePayload.error && typeof maybePayload.error === "object") {
    const maybeError = maybePayload.error as ErrorShape;
    const detail = firstValidationDetail(maybeError.details);

    if (detail) {
      return detail;
    }

    if (typeof maybeError.message === "string" && maybeError.message.length > 0) {
      return maybeError.message;
    }
  }

  return fallback;
}
