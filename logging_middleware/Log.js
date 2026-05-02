/**
 * Reusable Logging Middleware
 * Makes POST API calls to evaluation service logging endpoint
 * Used for both backend and frontend logging
 */

const LOG_API_ENDPOINT = "http://20.207.122.201/evaluation-service/logs";

const VALID_STACKS = ["backend", "frontend"];
const VALID_LEVELS = ["debug", "info", "warn", "error", "fatal"];
const VALID_PACKAGES = [
  "cache", "controller", "cron_job", "db", "domain", "handler", "repository", "route", "service",
  "api", "component", "hook", "page", "state", "style",
  "auth", "config", "middleware", "utils"
];

/**
 * Validates if a string is a valid Stack value
 * @param {string} value - Stack value to validate
 * @returns {boolean} True if valid stack
 */
function isValidStack(value) {
  return VALID_STACKS.includes(value.toLowerCase());
}

/**
 * Validates if a string is a valid Level value
 * @param {string} value - Level value to validate
 * @returns {boolean} True if valid level
 */
function isValidLevel(value) {
  return VALID_LEVELS.includes(value.toLowerCase());
}

/**
 * Validates if a string is a valid Package value
 * @param {string} value - Package value to validate
 * @returns {boolean} True if valid package
 */
function isValidPackage(value) {
  return VALID_PACKAGES.includes(value.toLowerCase());
}

/**
 * Log function signature: Log(stack, level, package, message)
 * @param {string} stack - "backend" or "frontend"
 * @param {string} level - "debug" | "info" | "warn" | "error" | "fatal"
 * @param {string} package_ - Valid package name
 * @param {string} message - Log message string
 * @returns {Promise<void>}
 */
async function Log(stack, level, package_, message) {
  try {
    // Validate all parameters
    if (!isValidStack(stack)) {
      throw new Error(`Invalid stack: "${stack}". Must be "backend" or "frontend"`);
    }

    if (!isValidLevel(level)) {
      throw new Error(`Invalid level: "${level}". Must be one of: debug, info, warn, error, fatal`);
    }

    if (!isValidPackage(package_)) {
      throw new Error(`Invalid package: "${package_}". Must be a valid backend, frontend, or shared package`);
    }

    if (!message || typeof message !== "string") {
      throw new Error("Message must be a non-empty string");
    }

    // Build request body
    const requestBody = {
      stack: stack.toLowerCase(),
      level: level.toLowerCase(),
      package: package_.toLowerCase(),
      message: message
    };

    // Make POST request to logging endpoint
    const response = await fetch(LOG_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": "AWJeWrbVtExdNCYN" // Replace with your actual token
      },
      body: JSON.stringify(requestBody)
    });

    // Handle response
    if (!response.ok) {
      console.error(`[Logging] API error: ${response.status} ${response.statusText}`);
    }

  } catch (error) {
    // Log validation errors locally to avoid infinite loops
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Logging Middleware] Error: ${errorMessage}`);
  }
}

module.exports = { Log, VALID_STACKS, VALID_LEVELS, VALID_PACKAGES };
