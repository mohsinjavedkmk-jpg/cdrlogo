"use client";

export const ERROR_CODES = {
  // Validation
  MISSING_FIELDS:         "MISSING_FIELDS",
  INVALID_EMAIL:          "INVALID_EMAIL",
  PASSWORD_TOO_SHORT:     "PASSWORD_TOO_SHORT",
  NAME_TOO_SHORT:         "NAME_TOO_SHORT",
  NAME_TOO_LONG:          "NAME_TOO_LONG",
  INVALID_NAME:           "INVALID_NAME",

  // Auth / User
  EMAIL_ALREADY_EXISTS:   "EMAIL_ALREADY_EXISTS",
  USER_NOT_FOUND:         "USER_NOT_FOUND",
  ALREADY_VERIFIED:       "ALREADY_VERIFIED",
  TOKEN_INVALID:          "TOKEN_INVALID",
  TOKEN_EXPIRED:          "TOKEN_EXPIRED",

  // Email
  EMAIL_SEND_FAILED:      "EMAIL_SEND_FAILED",

  // Server
  INTERNAL_ERROR:         "INTERNAL_ERROR",
  DB_ERROR:               "DB_ERROR",
};

export const ERRORS = {
  // ── Validation ──────────────────────────────
  [ERROR_CODES.MISSING_FIELDS]: {
    code:    ERROR_CODES.MISSING_FIELDS,
    message: "Name, email, and password are all required.",
    status:  400,
  },
  [ERROR_CODES.INVALID_EMAIL]: {
    code:    ERROR_CODES.INVALID_EMAIL,
    message: "Please enter a valid email address (e.g. user@example.com).",
    status:  400,
  },
  [ERROR_CODES.PASSWORD_TOO_SHORT]: {
    code:    ERROR_CODES.PASSWORD_TOO_SHORT,
    message: "Password must be at least 6 characters long.",
    status:  400,
  },
  [ERROR_CODES.NAME_TOO_SHORT]: {
    code:    ERROR_CODES.NAME_TOO_SHORT,
    message: "Name must be at least 2 characters long.",
    status:  400,
  },
  [ERROR_CODES.NAME_TOO_LONG]: {
    code:    ERROR_CODES.NAME_TOO_LONG,
    message: "Name must not exceed 50 characters.",
    status:  400,
  },
  [ERROR_CODES.INVALID_NAME]: {
    code:    ERROR_CODES.INVALID_NAME,
    message: "Name can only contain letters, spaces, hyphens, and apostrophes.",
    status:  400,
  },

  // ── Auth / User ──────────────────────────────
  [ERROR_CODES.EMAIL_ALREADY_EXISTS]: {
    code:    ERROR_CODES.EMAIL_ALREADY_EXISTS,
    message: "This email is already registered. Please log in or use a different email.",
    status:  409,
  },
  [ERROR_CODES.USER_NOT_FOUND]: {
    code:    ERROR_CODES.USER_NOT_FOUND,
    message: "No account found with this email address.",
    status:  404,
  },
  [ERROR_CODES.ALREADY_VERIFIED]: {
    code:    ERROR_CODES.ALREADY_VERIFIED,
    message: "Your email is already verified. You can log in.",
    status:  400,
  },
  [ERROR_CODES.TOKEN_INVALID]: {
    code:    ERROR_CODES.TOKEN_INVALID,
    message: "The verification link is invalid or has already been used.",
    status:  400,
  },
  [ERROR_CODES.TOKEN_EXPIRED]: {
    code:    ERROR_CODES.TOKEN_EXPIRED,
    message: "Your verification link has expired. Please request a new one.",
    status:  410,
  },

  // ── Email ────────────────────────────────────
  [ERROR_CODES.EMAIL_SEND_FAILED]: {
    code:    ERROR_CODES.EMAIL_SEND_FAILED,
    message: "We couldn't send the verification email. Please try again in a moment.",
    status:  502,
  },

  // ── Server ───────────────────────────────────
  [ERROR_CODES.INTERNAL_ERROR]: {
    code:    ERROR_CODES.INTERNAL_ERROR,
    message: "Something went wrong on our end. Please try again later.",
    status:  500,
  },
  [ERROR_CODES.DB_ERROR]: {
    code:    ERROR_CODES.DB_ERROR,
    message: "A database error occurred. Please try again later.",
    status:  500,
  },
};

/**
 * Build a standard error response object.
 * @param {string} errorCode  - One of ERROR_CODES
 * @param {string} [detail]   - Optional extra detail (shown only in dev)
 */
export function buildError(errorCode, detail = null) {
  const error = ERRORS[errorCode] ?? ERRORS[ERROR_CODES.INTERNAL_ERROR];

  return {
    status:  false,
    code:    error.code,
    message: error.message,
    ...(process.env.NODE_ENV === "development" && detail ? { detail } : {}),
  };
}