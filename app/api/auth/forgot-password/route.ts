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

    const successResponse = {
      success: true,
      message: "If an account with that email exists, we sent a password reset link.",
    };

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(successResponse);
    }

    const resetToken = crypto.randomUUID();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    // Send the reset email synchronously so the serverless runtime cannot cut the
    // delivery/retry loop short before the request returns. The response stays
    // identical whether or not an account exists (anti-account-enumeration); any
    // failure is logged here and recorded in the email delivery log.
    const result = await sendResetPasswordEmail(user.email, user.firstName, resetToken);

    if (!result.success) {
      console.error(
        `[ForgotPassword] Reset email failed for ${user.email.slice(0, 3)}*** (id: ${user.id}):`,
        result.error
      );
    }

    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
