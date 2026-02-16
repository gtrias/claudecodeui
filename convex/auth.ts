import { convexAuth } from "@convex-dev/auth/server";
import { Email } from "@convex-dev/auth/providers/Email";

// Generate a 6-digit numeric OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Email({
      maxAge: 60 * 15, // 15 minutes
      generateVerificationToken: generateOTP,
      async sendVerificationRequest({ identifier: email, token }) {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.AUTH_RESEND_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Claude Code UI <onboarding@resend.dev>",
            to: [email],
            subject: "Your sign-in code: " + token,
            html: `
              <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Sign in to Claude Code UI</h2>
                <p style="color: #666;">Your verification code is:</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${token}</span>
                </div>
                <p style="color: #999; font-size: 14px;">This code expires in 15 minutes.</p>
                <p style="color: #999; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
              </div>
            `,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to send email: ${error}`);
        }
      },
    }),
  ],
});
