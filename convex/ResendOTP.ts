import { Email } from "@convex-dev/auth/providers/Email";
import { Resend } from "resend";

export const ResendOTP = Email({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 20, // 20 minutes
  async generateVerificationToken() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },
  async sendVerificationRequest({ identifier: email, token }) {
    const resend = new Resend(process.env.AUTH_RESEND_KEY);
    const { error } = await resend.emails.send({
      from: "Mapdis <noreply@mapdis.com>",
      to: [email],
      subject: "Your Mapdis verification code",
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
          <h2>Your verification code</h2>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 24px 0;">${token}</p>
          <p>This code expires in 20 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      `,
    });
    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  },
});

export const ResendOTPPasswordReset = Email({
  id: "resend-otp-password-reset",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 20, // 20 minutes
  async generateVerificationToken() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },
  async sendVerificationRequest({ identifier: email, token }) {
    const resend = new Resend(process.env.AUTH_RESEND_KEY);
    const { error } = await resend.emails.send({
      from: "Mapdis <noreply@mapdis.com>",
      to: [email],
      subject: "Reset your Mapdis password",
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
          <h2>Password Reset</h2>
          <p>Use this code to reset your password:</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 24px 0;">${token}</p>
          <p>This code expires in 20 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      `,
    });
    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  },
});
