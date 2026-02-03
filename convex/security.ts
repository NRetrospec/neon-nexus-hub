/**
 * SECURITY UTILITIES
 *
 * This module provides security hardening utilities following OWASP best practices:
 * - Rate limiting (IP + user-based)
 * - Input validation and sanitization
 * - XSS prevention
 *
 * @module security
 */

import { MutationCtx, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ==================== RATE LIMITING ====================

/**
 * Rate limit configuration for different endpoint types
 * SECURITY: These limits prevent brute force attacks and spam
 */
export const RATE_LIMITS = {
  // High-frequency endpoints (read-heavy operations)
  default: { windowMs: 60_000, maxRequests: 60 },      // 60 req/min

  // Authentication-related (stricter limits)
  auth: { windowMs: 60_000, maxRequests: 10 },         // 10 req/min

  // Content creation (prevent spam)
  create: { windowMs: 60_000, maxRequests: 20 },       // 20 req/min

  // Sensitive operations (very strict)
  sensitive: { windowMs: 60_000, maxRequests: 5 },     // 5 req/min

  // Chat messages (allow more frequent)
  chat: { windowMs: 60_000, maxRequests: 30 },         // 30 req/min

  // File uploads (strict)
  upload: { windowMs: 300_000, maxRequests: 10 },      // 10 per 5 min

  // Admin operations
  admin: { windowMs: 60_000, maxRequests: 30 },        // 30 req/min
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Rate limit error with structured information for graceful 429 responses
 * SECURITY: Provides clear feedback without exposing internal details
 */
export class RateLimitError extends Error {
  public readonly retryAfter: number;
  public readonly endpoint: string;

  constructor(endpoint: string, retryAfterMs: number) {
    const retrySeconds = Math.ceil(retryAfterMs / 1000);
    super(`Rate limit exceeded. Please try again in ${retrySeconds} seconds.`);
    this.name = "RateLimitError";
    this.retryAfter = retrySeconds;
    this.endpoint = endpoint;
  }
}

/**
 * Check and enforce rate limits for an endpoint
 * SECURITY: Prevents brute force, spam, and DoS attacks
 *
 * @param ctx - Convex mutation context
 * @param identifier - IP address or user ID for tracking
 * @param endpoint - Name of the endpoint being rate limited
 * @param limitType - Type of rate limit to apply
 * @throws RateLimitError if rate limit exceeded
 */
export async function checkRateLimit(
  ctx: MutationCtx,
  identifier: string,
  endpoint: string,
  limitType: RateLimitType = "default"
): Promise<void> {
  const config = RATE_LIMITS[limitType];
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Look up existing rate limit record
  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_identifier_and_endpoint", (q) =>
      q.eq("identifier", identifier).eq("endpoint", endpoint)
    )
    .first();

  // Check if currently blocked
  if (existing?.blocked && existing.blockedUntil && existing.blockedUntil > now) {
    throw new RateLimitError(endpoint, existing.blockedUntil - now);
  }

  if (existing) {
    // Check if we're in the same time window
    if (existing.windowStart > windowStart) {
      // Same window - check count
      if (existing.requestCount >= config.maxRequests) {
        // Rate limit exceeded - block for the remainder of the window plus buffer
        const blockedUntil = existing.windowStart + config.windowMs + 5000; // 5s buffer
        await ctx.db.patch(existing._id, {
          blocked: true,
          blockedUntil,
          lastRequest: now,
        });
        throw new RateLimitError(endpoint, blockedUntil - now);
      }

      // Increment counter
      await ctx.db.patch(existing._id, {
        requestCount: existing.requestCount + 1,
        lastRequest: now,
      });
    } else {
      // New window - reset counter
      await ctx.db.patch(existing._id, {
        windowStart: now,
        requestCount: 1,
        lastRequest: now,
        blocked: false,
        blockedUntil: undefined,
      });
    }
  } else {
    // First request - create record
    await ctx.db.insert("rateLimits", {
      identifier,
      endpoint,
      windowStart: now,
      requestCount: 1,
      lastRequest: now,
      blocked: false,
    });
  }
}

/**
 * Create a rate limit identifier from user ID
 * SECURITY: Separates user-based limits from IP-based limits
 */
export function userRateLimitId(userId: Id<"users">): string {
  return `user:${userId}`;
}

/**
 * Create a rate limit identifier from IP address
 * SECURITY: Used when user is not authenticated
 */
export function ipRateLimitId(ipAddress: string): string {
  // SECURITY: Normalize IPv6 addresses to prevent bypass
  const normalized = ipAddress.toLowerCase().trim();
  return `ip:${normalized}`;
}

// ==================== INPUT VALIDATION ====================

/**
 * Validation error with structured information
 * SECURITY: Provides clear feedback for form validation
 */
export class ValidationError extends Error {
  public readonly field: string;
  public readonly code: string;

  constructor(field: string, message: string, code: string = "INVALID") {
    super(message);
    this.name = "ValidationError";
    this.field = field;
    this.code = code;
  }
}

/**
 * SECURITY: Dangerous HTML/script patterns that could enable XSS
 * These patterns are blocked in user-generated content
 */
const XSS_PATTERNS = [
  /<script[^>]*>/gi,
  /<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,                    // onclick=, onerror=, etc.
  /<iframe[^>]*>/gi,
  /<object[^>]*>/gi,
  /<embed[^>]*>/gi,
  /<link[^>]*>/gi,
  /<meta[^>]*>/gi,
  /data:text\/html/gi,
  /vbscript:/gi,
  /<svg[^>]*onload/gi,
  /expression\s*\(/gi,              // CSS expression()
];

/**
 * SQL injection patterns (for defense in depth, though Convex uses document DB)
 * SECURITY: Prevents NoSQL injection attacks
 */
const INJECTION_PATTERNS = [
  /'\s*(or|and)\s*'?1/gi,           // SQL OR/AND 1
  /;\s*(drop|delete|update|insert)/gi,
  /\$where/gi,                       // MongoDB injection
  /\$gt:|$lt:|$ne:|$regex:/gi,       // NoSQL operators in strings
];

/**
 * Sanitize a string by removing potentially dangerous content
 * SECURITY: Prevents XSS and injection attacks
 *
 * @param input - Raw user input
 * @param options - Sanitization options
 * @returns Sanitized string
 */
export function sanitizeString(
  input: string,
  options: {
    maxLength?: number;
    allowHtml?: boolean;
    trim?: boolean;
    field?: string;
  } = {}
): string {
  const { maxLength, allowHtml = false, trim = true, field = "input" } = options;

  if (typeof input !== "string") {
    throw new ValidationError(field, "Input must be a string", "TYPE_ERROR");
  }

  let sanitized = input;

  // Trim whitespace
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Check for XSS patterns (unless HTML explicitly allowed)
  if (!allowHtml) {
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(sanitized)) {
        throw new ValidationError(
          field,
          "Input contains potentially unsafe content",
          "XSS_DETECTED"
        );
      }
    }
  }

  // Check for injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      throw new ValidationError(
        field,
        "Input contains invalid characters",
        "INJECTION_DETECTED"
      );
    }
  }

  // Enforce max length
  if (maxLength && sanitized.length > maxLength) {
    throw new ValidationError(
      field,
      `Input exceeds maximum length of ${maxLength} characters`,
      "MAX_LENGTH"
    );
  }

  // Escape HTML entities for safe display (unless HTML allowed)
  if (!allowHtml) {
    sanitized = escapeHtml(sanitized);
  }

  return sanitized;
}

/**
 * Escape HTML entities to prevent XSS when rendering
 * SECURITY: Core XSS prevention function
 */
export function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
  };

  return str.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Validate and sanitize a URL
 * SECURITY: Prevents javascript: URLs and other malicious schemes
 *
 * @param url - URL to validate
 * @param options - Validation options
 * @returns Validated URL
 */
export function validateUrl(
  url: string,
  options: {
    allowedProtocols?: string[];
    maxLength?: number;
    field?: string;
  } = {}
): string {
  const {
    allowedProtocols = ["http:", "https:"],
    maxLength = 2048,
    field = "url",
  } = options;

  const trimmed = url.trim();

  if (trimmed.length === 0) {
    throw new ValidationError(field, "URL is required", "REQUIRED");
  }

  if (trimmed.length > maxLength) {
    throw new ValidationError(
      field,
      `URL exceeds maximum length of ${maxLength} characters`,
      "MAX_LENGTH"
    );
  }

  // Parse URL to validate structure
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new ValidationError(field, "Invalid URL format", "INVALID_FORMAT");
  }

  // SECURITY: Block dangerous protocols
  if (!allowedProtocols.includes(parsed.protocol)) {
    throw new ValidationError(
      field,
      `URL protocol must be one of: ${allowedProtocols.join(", ")}`,
      "INVALID_PROTOCOL"
    );
  }

  // SECURITY: Block javascript: and data: URLs that might slip through
  const lowerUrl = trimmed.toLowerCase();
  if (
    lowerUrl.includes("javascript:") ||
    lowerUrl.includes("data:text/html") ||
    lowerUrl.includes("vbscript:")
  ) {
    throw new ValidationError(field, "URL contains unsafe content", "UNSAFE_URL");
  }

  return trimmed;
}

/**
 * Validate an email address
 * SECURITY: Prevents malformed emails and potential injection
 *
 * @param email - Email to validate
 * @param field - Field name for error messages
 * @returns Validated email (lowercased and trimmed)
 */
export function validateEmail(email: string, field: string = "email"): string {
  const trimmed = email.trim().toLowerCase();

  if (trimmed.length === 0) {
    throw new ValidationError(field, "Email is required", "REQUIRED");
  }

  if (trimmed.length > 254) {
    throw new ValidationError(field, "Email exceeds maximum length", "MAX_LENGTH");
  }

  // RFC 5322 compliant email regex (simplified but effective)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    throw new ValidationError(field, "Invalid email format", "INVALID_FORMAT");
  }

  // SECURITY: Check for suspicious patterns
  if (trimmed.includes("..") || trimmed.startsWith(".") || trimmed.includes(".@")) {
    throw new ValidationError(field, "Invalid email format", "INVALID_FORMAT");
  }

  return trimmed;
}

/**
 * Validate a number within a range
 * SECURITY: Prevents integer overflow and invalid numeric input
 *
 * @param value - Number to validate
 * @param options - Validation options
 * @returns Validated number
 */
export function validateNumber(
  value: number,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
    field?: string;
  } = {}
): number {
  const { min, max, integer = false, field = "number" } = options;

  if (typeof value !== "number" || isNaN(value)) {
    throw new ValidationError(field, "Value must be a number", "TYPE_ERROR");
  }

  if (!isFinite(value)) {
    throw new ValidationError(field, "Value must be a finite number", "INVALID");
  }

  if (integer && !Number.isInteger(value)) {
    throw new ValidationError(field, "Value must be an integer", "NOT_INTEGER");
  }

  if (min !== undefined && value < min) {
    throw new ValidationError(field, `Value must be at least ${min}`, "MIN_VALUE");
  }

  if (max !== undefined && value > max) {
    throw new ValidationError(field, `Value must be at most ${max}`, "MAX_VALUE");
  }

  return value;
}

/**
 * Validate an array with length constraints
 * SECURITY: Prevents array-based DoS attacks with huge arrays
 *
 * @param arr - Array to validate
 * @param options - Validation options
 * @returns Validated array
 */
export function validateArray<T>(
  arr: T[],
  options: {
    minLength?: number;
    maxLength?: number;
    field?: string;
  } = {}
): T[] {
  const { minLength = 0, maxLength = 100, field = "array" } = options;

  if (!Array.isArray(arr)) {
    throw new ValidationError(field, "Value must be an array", "TYPE_ERROR");
  }

  if (arr.length < minLength) {
    throw new ValidationError(
      field,
      `Array must have at least ${minLength} items`,
      "MIN_LENGTH"
    );
  }

  if (arr.length > maxLength) {
    throw new ValidationError(
      field,
      `Array must have at most ${maxLength} items`,
      "MAX_LENGTH"
    );
  }

  return arr;
}

/**
 * Validate that an object only contains expected fields
 * SECURITY: Prevents mass assignment attacks by rejecting unexpected fields
 *
 * @param obj - Object to validate
 * @param allowedFields - Set of allowed field names
 * @param field - Field name for error messages
 */
export function validateNoExtraFields(
  obj: Record<string, unknown>,
  allowedFields: Set<string>,
  field: string = "object"
): void {
  const extraFields = Object.keys(obj).filter((key) => !allowedFields.has(key));

  if (extraFields.length > 0) {
    throw new ValidationError(
      field,
      `Unexpected fields: ${extraFields.join(", ")}`,
      "EXTRA_FIELDS"
    );
  }
}

/**
 * Validate a date of birth string
 * SECURITY: Validates date format and prevents future dates
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param field - Field name for error messages
 * @returns Validated date string
 */
export function validateDateOfBirth(
  dateStr: string,
  field: string = "dateOfBirth"
): string {
  const trimmed = dateStr.trim();

  // Validate format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(trimmed)) {
    throw new ValidationError(
      field,
      "Date must be in YYYY-MM-DD format",
      "INVALID_FORMAT"
    );
  }

  // Parse and validate date
  const date = new Date(trimmed);
  if (isNaN(date.getTime())) {
    throw new ValidationError(field, "Invalid date", "INVALID_DATE");
  }

  // Check if date is in the past
  const now = new Date();
  if (date > now) {
    throw new ValidationError(field, "Date cannot be in the future", "FUTURE_DATE");
  }

  // Check if date is reasonable (not before 1900)
  if (date.getFullYear() < 1900) {
    throw new ValidationError(field, "Invalid date", "INVALID_DATE");
  }

  return trimmed;
}

// ==================== CONTENT-SPECIFIC VALIDATORS ====================

/**
 * Validate social post content
 * SECURITY: Enforces length limits and sanitizes for XSS
 */
export function validatePostContent(content: string): string {
  return sanitizeString(content, {
    maxLength: 5000,
    trim: true,
    field: "content",
  });
}

/**
 * Validate chat message content
 * SECURITY: Enforces length limits and sanitizes for XSS
 */
export function validateChatMessage(content: string): string {
  return sanitizeString(content, {
    maxLength: 2000,
    trim: true,
    field: "message",
  });
}

/**
 * Validate comment content
 * SECURITY: Enforces length limits and sanitizes for XSS
 */
export function validateComment(content: string): string {
  return sanitizeString(content, {
    maxLength: 1000,
    trim: true,
    field: "comment",
  });
}

/**
 * Validate bio content
 * SECURITY: Enforces length limits and sanitizes for XSS
 */
export function validateBio(bio: string): string {
  return sanitizeString(bio, {
    maxLength: 500,
    trim: true,
    field: "bio",
  });
}

/**
 * Validate status content
 * SECURITY: Enforces length limits and sanitizes for XSS
 */
export function validateStatus(status: string): string {
  return sanitizeString(status, {
    maxLength: 100,
    trim: true,
    field: "status",
  });
}

/**
 * Validate username
 * SECURITY: Prevents impersonation and special character abuse
 */
export function validateUsername(username: string): string {
  const trimmed = username.trim();

  if (trimmed.length < 2) {
    throw new ValidationError(
      "username",
      "Username must be at least 2 characters",
      "MIN_LENGTH"
    );
  }

  if (trimmed.length > 30) {
    throw new ValidationError(
      "username",
      "Username must be 30 characters or less",
      "MAX_LENGTH"
    );
  }

  // Only allow alphanumeric, underscore, hyphen
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(trimmed)) {
    throw new ValidationError(
      "username",
      "Username can only contain letters, numbers, underscores, and hyphens",
      "INVALID_CHARS"
    );
  }

  return trimmed;
}

/**
 * Validate poll title
 * SECURITY: Enforces length limits and sanitizes for XSS
 */
export function validatePollTitle(title: string): string {
  return sanitizeString(title, {
    maxLength: 100,
    trim: true,
    field: "title",
  });
}

/**
 * Validate poll/rating score
 * SECURITY: Ensures scores are within valid range
 */
export function validateScore(score: number, field: string = "score"): number {
  return validateNumber(score, {
    min: 0,
    max: 10,
    integer: true,
    field,
  });
}

/**
 * Validate group chat name
 * SECURITY: Enforces length limits and sanitizes
 */
export function validateGroupName(name: string): string {
  return sanitizeString(name, {
    maxLength: 50,
    trim: true,
    field: "groupName",
  });
}

/**
 * Validate quest answer
 * SECURITY: Sanitizes while preserving case for comparison
 */
export function validateQuestAnswer(answer: string): string {
  const trimmed = answer.trim();

  if (trimmed.length === 0) {
    throw new ValidationError("answer", "Answer is required", "REQUIRED");
  }

  if (trimmed.length > 200) {
    throw new ValidationError(
      "answer",
      "Answer must be 200 characters or less",
      "MAX_LENGTH"
    );
  }

  // Check for injection patterns but don't escape (need for comparison)
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      throw new ValidationError(
        "answer",
        "Answer contains invalid characters",
        "INVALID_CHARS"
      );
    }
  }

  return trimmed;
}

/**
 * Validate search term
 * SECURITY: Prevents regex injection and excessive length
 */
export function validateSearchTerm(term: string): string {
  const trimmed = term.trim();

  if (trimmed.length > 100) {
    throw new ValidationError(
      "searchTerm",
      "Search term must be 100 characters or less",
      "MAX_LENGTH"
    );
  }

  // Remove regex special characters to prevent ReDoS
  const sanitized = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "");

  return sanitized;
}
