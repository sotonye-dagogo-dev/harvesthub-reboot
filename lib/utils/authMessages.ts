/**
 * Maps raw API error strings to concise, user-facing messages for all auth flows.
 * Keeps technical details out of the UI while still being specific enough to be actionable.
 */

const LOGIN_ERROR_MAP: Record<string, string> = {
  "Invalid email or password": "Incorrect email or password. Please try again.",
  "Email and password are required": "Please enter your email and password.",
  "Account is inactive. Please contact support.":
    "This account has been deactivated. Please contact support.",
  "Please verify your email address before logging in":
    "Please verify your email before signing in. Check your inbox for the verification link.",
  "Database error": "We\u2019re having trouble connecting right now. Please try again in a moment.",
  "Internal server error":
    "Something went wrong on our end. Please try again in a moment.",
  "Too many requests":
    "Too many sign-in attempts. Please wait a few minutes before trying again.",
  "Login failed": "Sign-in failed. Please check your credentials and try again.",
};

const SIGNUP_ERROR_MAP: Record<string, string> = {
  "Missing required fields":
    "Please fill in all required fields and try again.",
  "User with this email already exists":
    "An account with this email already exists. Try signing in instead.",
  "A user with this email or details already exists.":
    "An account with this email already exists. Try signing in instead.",
  "Terms & Conditions must be accepted":
    "Please accept the Terms & Conditions to continue.",
  "Registration failed. Please try again.":
    "Registration failed. Please review your details and try again.",
  "Database error":
    "We\u2019re having trouble creating your account right now. Please try again in a moment.",
  "Internal server error":
    "Something went wrong on our end. Please try again in a moment.",
};

const PASSWORD_ERROR_MAP: Record<string, string> = {
  "Failed to send reset email":
    "We couldn\u2019t send a reset email right now. Please try again in a moment.",
  "No account found with that email address.":
    "No account found with that email address. Check the email you entered or create a new account.",
  "We couldn't send the reset email right now. Please try again in a few minutes.":
    "We couldn\u2019t send the reset email right now. Please try again in a few minutes.",
  "Invalid or expired reset token":
    "This reset link has expired or is invalid. Please request a new one.",
  "Invalid reset link. Please request a new password reset.":
    "This reset link is invalid. Please request a new password reset.",
  "Failed to reset password":
    "We couldn\u2019t reset your password right now. Please try again.",
  "Internal server error":
    "Something went wrong on our end. Please try again in a moment.",
};

function getFromMap(raw: string, map: Record<string, string>): string {
  if (map[raw]) return map[raw];
  // Generic catch-all for opaque server errors surfaced to the user
  const lower = raw.toLowerCase();
  if (
    lower.includes("database") ||
    lower.includes("server error") ||
    lower.includes("internal")
  ) {
    return "Something went wrong on our end. Please try again in a moment.";
  }
  return raw;
}

export function getFriendlyLoginError(raw: string): string {
  return getFromMap(raw, LOGIN_ERROR_MAP);
}

export function getFriendlySignupError(raw: string): string {
  return getFromMap(raw, SIGNUP_ERROR_MAP);
}

export function getFriendlyPasswordError(raw: string): string {
  return getFromMap(raw, PASSWORD_ERROR_MAP);
}
