import { describe, expect, it } from "vitest";
import {
  getFriendlyLoginError,
  getFriendlySignupError,
  getFriendlyPasswordError,
} from "@/lib/utils/authMessages";

describe("authMessages friendly mappings", () => {
  it("maps the forgot-password user-not-found error to an actionable message", () => {
    expect(getFriendlyPasswordError("No account found with that email address.")).toBe(
      "No account found with that email address. Check the email you entered or create a new account."
    );
  });

  it("maps the forgot-password delivery-failure error to a retry message", () => {
    expect(
      getFriendlyPasswordError(
        "We couldn't send the reset email right now. Please try again in a few minutes."
      )
    ).toBe("We couldn\u2019t send the reset email right now. Please try again in a few minutes.");
  });

  it("keeps unknown raw messages intact", () => {
    expect(getFriendlyPasswordError("Some custom server message")).toBe(
      "Some custom server message"
    );
  });

  it("falls back to a friendly generic for internal server errors", () => {
    expect(getFriendlyLoginError("Internal server error")).toBe(
      "Something went wrong on our end. Please try again in a moment."
    );
    expect(getFriendlySignupError("Database error")).toContain("having trouble");
  });
});