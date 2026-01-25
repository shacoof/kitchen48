/**
 * Email Service
 * Handles sending emails via Gmail SMTP
 * Configuration from database parameters with .env fallback
 */

import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { createLogger } from '../lib/logger.js';
import { parameterService } from '../modules/parameters/parameter.service.js';

const logger = createLogger('EmailService');

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface VerificationEmailOptions {
  to: string;
  firstName: string;
  verificationToken: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private rateLimiter: Map<string, { count: number; lastReset: number }>;
  private readonly maxEmailsPerMinute = 1;

  constructor() {
    this.rateLimiter = new Map();
  }

  /**
   * Get or create transporter with config from database parameters
   */
  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    // Get config from database parameters with env fallback
    const host = await parameterService.getSystemValue('email.smtp.host', env.EMAIL_SERVER_HOST);
    const port = await parameterService.getSystemValue('email.smtp.port', env.EMAIL_SERVER_PORT);
    const user = await parameterService.getSystemValue('email.smtp.user', env.EMAIL_SERVER_USER);

    this.transporter = nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port: parseInt(port || '587'),
      secure: false, // true for 465, false for 587
      auth: {
        user: user || '',
        pass: env.EMAIL_SERVER_PASSWORD, // Password always from env (sensitive)
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    return this.transporter;
  }

  /**
   * Reset transporter (call after config changes)
   */
  resetTransporter(): void {
    this.transporter = null;
  }

  /**
   * Check rate limiting for email sending
   */
  private checkRateLimit(email: string): { allowed: boolean; error?: string } {
    const now = Date.now();
    const key = email.toLowerCase();

    let userLimits = this.rateLimiter.get(key);

    if (!userLimits) {
      userLimits = { count: 0, lastReset: now };
      this.rateLimiter.set(key, userLimits);
    }

    // Reset counter if a minute has passed
    if (now - userLimits.lastReset > 60 * 1000) {
      userLimits.count = 0;
      userLimits.lastReset = now;
    }

    // Check if user has exceeded rate limit
    if (userLimits.count >= this.maxEmailsPerMinute) {
      const timeLeft = Math.ceil((60 * 1000 - (now - userLimits.lastReset)) / 1000);
      return {
        allowed: false,
        error: `Too many emails sent. Please wait ${timeLeft} seconds before trying again.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Send generic email
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      // Check rate limiting
      const rateLimitCheck = this.checkRateLimit(options.to);
      if (!rateLimitCheck.allowed) {
        logger.warning(`Email rate limit exceeded for ${options.to}`);
        return {
          success: false,
          error: rateLimitCheck.error,
        };
      }

      // Get transporter and from address from parameters
      const transporter = await this.getTransporter();
      const fromAddress = await parameterService.getSystemValue('email.fromAddress', env.EMAIL_FROM);

      // Send email
      const result = await transporter.sendMail({
        from: fromAddress || 'noreply@kitchen48.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      // Update rate limiting counter
      const userLimits = this.rateLimiter.get(options.to.toLowerCase());
      if (userLimits) {
        userLimits.count++;
      }

      logger.debug(`Email sent successfully to ${options.to}, messageId: ${result.messageId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to send email: ${error}`);
      return {
        success: false,
        error: 'Failed to send email',
      };
    }
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(
    options: VerificationEmailOptions
  ): Promise<{ success: boolean; error?: string }> {
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${options.verificationToken}`;

    const subject = 'Verify your email address - Kitchen48';

    const html = this.generateVerificationEmailHTML({
      firstName: options.firstName,
      verificationUrl,
    });

    const text = this.generateVerificationEmailText({
      firstName: options.firstName,
      verificationUrl,
    });

    return await this.sendEmail({
      to: options.to,
      subject,
      html,
      text,
    });
  }

  /**
   * Generate HTML email template for verification
   */
  private generateVerificationEmailHTML(options: {
    firstName: string;
    verificationUrl: string;
  }): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - Kitchen48</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f97316; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .button {
                display: inline-block;
                background: #f97316;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }
            .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
            .warning { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to Kitchen48!</h1>
            </div>
            <div class="content">
                <h2>Hello ${options.firstName},</h2>
                <p>Thank you for joining Kitchen48 - your cooking companion!</p>
                <p>To complete your registration, please verify your email address by clicking the button below:</p>

                <div style="text-align: center;">
                    <a href="${options.verificationUrl}" class="button">Verify Email Address</a>
                </div>

                <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; font-family: monospace; background: #f3f4f6; padding: 10px;">
                    ${options.verificationUrl}
                </p>

                <div class="warning">
                    <strong>Important:</strong> This link will expire in 24 hours for security reasons.
                </div>

                <p>If you didn't create an account with Kitchen48, please ignore this email.</p>

                <p>Happy cooking!<br>The Kitchen48 Team</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 Kitchen48. All rights reserved.</p>
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  /**
   * Generate text email template for verification
   */
  private generateVerificationEmailText(options: {
    firstName: string;
    verificationUrl: string;
  }): string {
    return `
Welcome to Kitchen48!

Hello ${options.firstName},

Thank you for joining Kitchen48 - your cooking companion!

To complete your registration, please verify your email address by visiting this link:

${options.verificationUrl}

Important: This link will expire in 24 hours for security reasons.

If you didn't create an account with Kitchen48, please ignore this email.

Happy cooking!
The Kitchen48 Team

---
© 2026 Kitchen48. All rights reserved.
This is an automated message, please do not reply to this email.
    `.trim();
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const transporter = await this.getTransporter();
      await transporter.verify();
      logger.debug('Email service connection test successful');
      return { success: true };
    } catch (error) {
      logger.error(`Email service connection test failed: ${error}`);
      return {
        success: false,
        error: 'Email service connection failed',
      };
    }
  }
}

export const emailService = new EmailService();
export default emailService;
