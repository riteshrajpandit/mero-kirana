"use client";

import { CSRF_HEADER_NAME } from "@/lib/constants";

type CsrfResponse = {
  token?: string;
  data?: {
    token?: string;
  };
};

const CSRF_STORAGE_KEY = "csrf_token";
let csrfRequestInFlight: Promise<string> | null = null;

async function requestCsrfTokenFromServer(): Promise<string> {
  const response = await fetch("/api/csrf-token", {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
  });

  const payload = (await response.json()) as CsrfResponse;

  const token = payload.data?.token ?? payload.token;

  if (!response.ok || typeof token !== "string" || token.length === 0) {
    throw new Error("Unable to fetch CSRF token");
  }

  localStorage.setItem(CSRF_STORAGE_KEY, token);
  return token;
}

export async function getCsrfToken(refresh = false): Promise<string> {
  if (!refresh) {
    const existingToken = localStorage.getItem(CSRF_STORAGE_KEY);
    if (existingToken) {
      return existingToken;
    }
  }

  if (!csrfRequestInFlight) {
    csrfRequestInFlight = requestCsrfTokenFromServer().finally(() => {
      csrfRequestInFlight = null;
    });
  }

  return csrfRequestInFlight;
}

export function clearCsrfToken() {
  localStorage.removeItem(CSRF_STORAGE_KEY);
}

export async function fetchWithCsrf(
  input: RequestInfo | URL,
  init: RequestInit,
): Promise<Response> {
  const execute = async (refresh: boolean) => {
    const token = await getCsrfToken(refresh);
    const headers = new Headers(init.headers ?? {});
    headers.set(CSRF_HEADER_NAME, token);

    return fetch(input, {
      ...init,
      headers,
      credentials: "same-origin",
    });
  };

  let response = await execute(false);

  if (response.status === 403) {
    response = await execute(true);
  }

  return response;
}
