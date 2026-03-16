/**
 * POST /api/auth/resend-verification
 * Resend email verification link
 */
import * as React from "react";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/services/email";
import { rateLimitStrict, getRateLimitResponse } from "@/lib/middleware/rate-limit";
import { VerifyEmail } from "@/lib/emails/VerifyEmail";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rl = await rateLimitStrict(`resend-verify:${ip}`);
    if (!rl.success) return getRateLimitResponse(rl);

    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const successResponse = {
      success: true,
      message: "If an account with that email exists, we sent a verification link.",
    };

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || user.emailVerified) {
      return NextResponse.json(successResponse);
    }

    const verificationToken = crypto.randomUUID();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
      },
    });

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;
    sendEmail({
      to: user.email,
      subject: "Verify Your Email — MyHarvestHub",
      react: <VerifyEmail firstName={user.firstName} verificationUrl={verificationUrl} />,
    }).catch((err) => console.error("Failed to send verification email:", err));

    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
