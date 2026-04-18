import { NextResponse } from "next/server";

const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Mero Kirana API",
    version: "1.0.0",
    description: "Offline-first POS and khata management API",
  },
  servers: [
    {
      url: process.env.NODE_ENV === "production" 
        ? "https://your-production-domain.com/api" 
        : "http://localhost:3000/api",
      description: "Current server",
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "mk_session",
      },
      csrfToken: {
        type: "apiKey",
        in: "header",
        name: "x-csrf-token",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              message: { type: "string" },
              code: { type: "string" },
              details: { 
                type: "object",
                additionalProperties: {
                  type: "array",
                  items: { type: "string" },
                },
              },
            },
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          name: { type: "string" },
          role: { type: "string", enum: ["OWNER", "STAFF"] },
          emailVerified: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Shop: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          slug: { type: "string" },
          subscriptionStatus: { type: "string", enum: ["TRIAL", "ACTIVE", "EXPIRED"] },
          trialEndsAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      Customer: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          phone: { type: "string", nullable: true },
          creditBalancePaisa: { type: "integer" },
          version: { type: "integer" },
          syncedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        tags: ["System"],
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", enum: ["healthy"] },
                    timestamp: { type: "string", format: "date-time" },
                    uptime: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/csrf-token": {
      get: {
        summary: "Get CSRF token",
        tags: ["Authentication"],
        responses: {
          "200": {
            description: "CSRF token generated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Login",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["shopSlug", "email", "password"],
                properties: {
                  shopSlug: { type: "string", minLength: 2, maxLength: 80 },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 12, maxLength: 128 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/User" },
                        shop: { $ref: "#/components/schemas/Shop" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "429": {
            description: "Too many attempts",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/auth/register": {
      post: {
        summary: "Register new shop",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["shopName", "shopSlug", "ownerName", "email", "password", "confirmPassword"],
                properties: {
                  shopName: { type: "string", minLength: 2, maxLength: 120 },
                  shopSlug: { type: "string", pattern: "^[a-z0-9-]+$" },
                  ownerName: { type: "string", minLength: 2, maxLength: 120 },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 12, maxLength: 128 },
                  confirmPassword: { type: "string", minLength: 12, maxLength: 128 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Registration successful",
          },
          "400": {
            description: "Invalid request",
          },
          "409": {
            description: "Shop slug or email already exists",
          },
          "429": {
            description: "Too many attempts",
          },
        },
      },
    },
    "/profile": {
      get: {
        summary: "Get current user profile",
        tags: ["Profile"],
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Profile data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/User" },
                    meta: {
                      type: "object",
                      properties: {
                        emailVerified: { type: "boolean" },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
          },
        },
      },
      put: {
        summary: "Update profile",
        tags: ["Profile"],
        security: [{ cookieAuth: [] }, { csrfToken: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", minLength: 2, maxLength: 120 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Profile updated",
          },
          "400": {
            description: "Invalid request",
          },
          "403": {
            description: "Invalid CSRF token",
          },
        },
      },
    },
    "/profile/change-password": {
      post: {
        summary: "Change password",
        tags: ["Profile"],
        security: [{ cookieAuth: [] }, { csrfToken: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: {
                  currentPassword: { type: "string", minLength: 12 },
                  newPassword: { type: "string", minLength: 12, maxLength: 128 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Password changed (requires relogin)",
          },
          "400": {
            description: "Invalid password",
          },
          "401": {
            description: "Current password incorrect",
          },
          "403": {
            description: "Invalid CSRF token",
          },
        },
      },
    },
    "/customers": {
      get: {
        summary: "Get customers",
        tags: ["Customers"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50, maximum: 100 },
          },
          {
            name: "cursor",
            in: "query",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "List of customers",
          },
          "401": {
            description: "Unauthorized",
          },
        },
      },
      post: {
        summary: "Create/update customer",
        tags: ["Customers"],
        security: [{ cookieAuth: [] }, { csrfToken: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  id: { type: "string", format: "uuid" },
                  name: { type: "string" },
                  phone: { type: "string" },
                  creditBalancePaisa: { type: "integer" },
                  version: { type: "integer" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Customer updated",
          },
          "201": {
            description: "Customer created",
          },
          "202": {
            description: "Update ignored (stale)",
          },
          "400": {
            description: "Invalid request",
          },
          "403": {
            description: "Invalid CSRF token",
          },
        },
      },
    },
    "/transactions": {
      get: {
        summary: "Get transactions",
        tags: ["Transactions"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50, maximum: 100 },
          },
          {
            name: "cursor",
            in: "query",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "List of transactions",
          },
          "401": {
            description: "Unauthorized",
          },
        },
      },
      post: {
        summary: "Create/update transaction",
        tags: ["Transactions"],
        security: [{ cookieAuth: [] }, { csrfToken: [] }],
        responses: {
          "200": {
            description: "Transaction updated",
          },
          "201": {
            description: "Transaction created",
          },
          "202": {
            description: "Update ignored (stale)",
          },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(openApiSpec);
}
