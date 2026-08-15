/**
 * POST /api/auth/forgot-password
 * Send password reset link
 */
import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/schemas/auth.schemas";
import { prisma } from "@/lib/db/prisma";
import { sendResetPasswordEmail } from "@/lib/services/email";
import { rateLimitStrict, getRateLimitResponse } from "@/lib/middleware/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rl = await rateLimitStrict(`forgot:${ip}`);
    if (!rl.success) return getRateLimitResponse(rl);

    const body = await req.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // No account with this email — surface truthful, actionable feedback instead of
    // pretending a link was sent. The product owner requires meaningful feedback: a
    // user who typo'd their address or never signed up should not land on a "check your
    // inbox" dead-end with zero signal. Rate limiting (above) still bounds enumeration.
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "No account found with that email address.",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const resetToken = crypto.randomUUID();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    // Send the reset email synchronously so the serverless runtime cannot cut the
    // delivery/retry loop short before the request returns. If the send itself fails,
    // report it instead of claiming success — otherwise the user waits forever for an
    // email that was never sent (and the delivery log records the failure).
    const result = await sendResetPasswordEmail(user.email, user.firstName, resetToken);

    if (!result.success) {
      console.error(
        `[ForgotPassword] Reset email failed for ${user.email.slice(0, 3)}*** (id: ${user.id}):`,
        result.error
      );
      return NextResponse.json(
        {
          success: false,
          error: "We couldn't send the reset email right now. Please try again in a few minutes.",
          code: "EMAIL_DELIVERY_FAILED",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password reset link sent. Check your email.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
