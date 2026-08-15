/**
 * POST /api/auth/resend-verification
 * Resend email verification link
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendVerifyEmail } from "@/lib/services/email";
import { rateLimitStrict, getRateLimitResponse } from "@/lib/middleware/rate-limit";

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
      message: "Verification link sent. Check your inbox.",
    };

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

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

    // Already-verified accounts have nothing to verify — say so instead of pretending
    // another link was sent.
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: "Your email is already verified. You can sign in now.",
      });
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

    // Await the send so a genuine delivery failure is reported instead of claiming a
    // link was sent. The delivery log records the attempt either way.
    const result = await sendVerifyEmail(user.email, user.firstName, verificationToken);

    if (!result.success) {
      console.error(
        `[ResendVerification] Verification email failed for ${user.email.slice(0, 3)}*** (id: ${user.id}):`,
        result.error
      );
      return NextResponse.json(
        {
          success: false,
          error: "We couldn't send the verification email right now. Please try again in a few minutes.",
          code: "EMAIL_DELIVERY_FAILED",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
