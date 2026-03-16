/**
 * POST /api/auth/forgot-password
 * Send password reset link
 */
import * as React from "react";
import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/schemas/auth.schemas";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/services/email";
import { rateLimitStrict, getRateLimitResponse } from "@/lib/middleware/rate-limit";
import { ResetPassword as ResetPasswordEmail } from "@/lib/emails/ResetPassword";

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

    // Send reset email (non-blocking)
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;
    sendEmail({
      to: user.email,
      subject: "Reset Your Password — MyHarvestHub",
      react: <ResetPasswordEmail firstName={user.firstName} resetUrl={resetUrl} />,
    }).catch((err) => console.error("Failed to send reset email:", err));

    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
