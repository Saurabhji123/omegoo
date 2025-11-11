import { Resend } from 'resend';

// Lazy init keeps local boot resilient when email credentials are missing.
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resendClient = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

if (!resendClient) {
  console.warn('⚠️ RESEND_API_KEY missing. Email sending disabled.');
}

interface SendPayload {
  to: string[];
  subject: string;
  html: string;
}

interface SendResult {
  success: boolean;
  data?: unknown;
}

const buildDisplayAddress = (raw: string | undefined, fallback: string): string => {
  const value = (raw || '').trim();
  if (!value) {
    return `Omegoo <${fallback}>`;
  }
  if (value.includes('<') && value.includes('>')) {
    return value;
  }
  return `Omegoo <${value}>`;
};

const PRIMARY_SENDER = buildDisplayAddress(process.env.RESEND_FROM_EMAIL, 'no-reply@omegoo.chat');
const FALLBACK_SENDER = buildDisplayAddress(process.env.RESEND_FALLBACK_FROM_EMAIL, 'onboarding@resend.dev');
const PLATFORM_URL = process.env.OMEGOO_APP_URL || 'https://www.omegoo.chat';

const resolveSenders = (): string[] => {
  if (PRIMARY_SENDER === FALLBACK_SENDER) {
    return [PRIMARY_SENDER];
  }
  return [PRIMARY_SENDER, FALLBACK_SENDER];
};

const sendWithFallback = async ({ to, subject, html }: SendPayload): Promise<SendResult> => {
  if (!resendClient) {
    return { success: false };
  }

  const senders = resolveSenders();

  for (let idx = 0; idx < senders.length; idx += 1) {
    const from = senders[idx];
    try {
      const response = await resendClient.emails.send({ from, to, subject, html });

      if (response.error) {
        console.error(`❌ Resend rejected email from ${from}`, response.error);
        if (idx === senders.length - 1) {
          return { success: false };
        }
        console.warn('⚠️ Trying fallback sender.');
        continue;
      }

      if (idx > 0) {
        console.warn(`⚠️ Email delivered using fallback sender ${from}.`);
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error(`❌ Error sending email from ${from}`, error);
      if (idx === senders.length - 1) {
        return { success: false };
      }
      console.warn('⚠️ Trying fallback sender after error.');
    }
  }

  return { success: false };
};

const escapeHtml = (value?: string | null): string => {
  if (!value) {
    return '';
  }
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

interface SendOTPArgs {
  email: string;
  otp: string;
  name?: string;
}

interface SendWelcomeArgs {
  email: string;
  name?: string;
}

interface AuthTemplateArgs {
  name?: string;
  otp?: string | null;
}

interface PasswordResetTemplateArgs {
  name?: string;
  resetUrl: string;
}

interface SendPasswordResetArgs {
  email: string;
  name?: string;
  token: string;
}

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTPEmail = async ({ email, otp, name }: SendOTPArgs): Promise<boolean> => {
  if (!resendClient) {
    console.warn(`⚠️ Skipping OTP email. RESEND_API_KEY missing. Target: ${email}`);
    return false;
  }

  console.log('📧 Sending OTP email to', email);

  const result = await sendWithFallback({
    to: [email],
    subject: 'Welcome to Omegoo – Verify Your Email',
    html: buildAuthEmailTemplate({ name, otp }),
  });

  if (!result.success) {
    console.error('❌ Failed to send OTP email.');
    return false;
  }

  console.log('✅ OTP email dispatched.', result.data);
  return true;
};

export const sendWelcomeEmail = async ({ email, name }: SendWelcomeArgs): Promise<boolean> => {
  if (!resendClient) {
    console.warn(`⚠️ Skipping welcome email. RESEND_API_KEY missing. Target: ${email}`);
    return false;
  }

  const result = await sendWithFallback({
    to: [email],
    subject: 'Welcome to Omegoo – Let\'s Get Started',
    html: buildAuthEmailTemplate({ name }),
  });

  if (!result.success) {
    console.error('❌ Failed to send welcome email.');
    return false;
  }

  console.log('✅ Welcome email dispatched.', result.data);
  return true;
};

export const sendPasswordResetEmail = async ({ email, name, token }: SendPasswordResetArgs): Promise<boolean> => {
  if (!resendClient) {
    console.warn(`⚠️ Skipping password reset email. RESEND_API_KEY missing. Target: ${email}`);
    return false;
  }

  const resetUrl = `${PLATFORM_URL.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

  const result = await sendWithFallback({
    to: [email],
    subject: 'Reset Your Omegoo Password',
    html: buildPasswordResetEmailTemplate({ name, resetUrl }),
  });

  if (!result.success) {
    console.error('❌ Failed to send password reset email.');
    return false;
  }

  console.log('✅ Password reset email dispatched.', result.data);
  return true;
};

const buildAuthEmailTemplate = ({ name, otp }: AuthTemplateArgs): string => {
  const displayName = escapeHtml(name) || 'there';
  const safeOtp = otp ? escapeHtml(otp) : null;
  const currentYear = new Date().getFullYear();
  const safePlatformUrl = escapeHtml(PLATFORM_URL);

  const headline = safeOtp
    ? `Welcome aboard, ${displayName}!`
    : `Hi ${displayName}, your journey starts now!`;

  const subHeadline = safeOtp
    ? 'We are thrilled to have you at Omegoo. To keep your account secure, please verify your email using the code below.'
    : 'Your Google account is all set! Dive into Omegoo and start discovering real conversations right away.';

  const verificationBlock = safeOtp
    ? `
        <div class="otp-box">
          <p style="margin: 0; text-transform: uppercase; letter-spacing: 2px; font-size: 12px; color: #a5b4fc;">Verify your email</p>
          <p class="otp-code">${safeOtp}</p>
          <p style="margin: 0; font-size: 13px; color: #cbd5f5;">Valid for the next 10 minutes. Please do not share this code with anyone.</p>
        </div>
      `
    : '';

  const supportNote = safeOtp
    ? 'If you did not request this email, simply ignore it. For any questions, reach us at'
    : 'Need a hand or have feedback? Reach us anytime at';

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome to Omegoo</title>
    <style>
      body { margin: 0; background-color: #0f172a; color: #e2e8f0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      a.button { display: inline-block; padding: 14px 32px; border-radius: 9999px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-weight: 600; }
      .card { background-color: #111c44; border-radius: 18px; padding: 32px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.35); }
      .feature { background-color: rgba(99, 102, 241, 0.12); border-radius: 12px; padding: 16px 18px; margin-bottom: 12px; }
      .otp-box { background: linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.35) 100%); border-radius: 16px; padding: 28px; text-align: center; color: #e0e7ff; }
      .otp-code { font-size: 36px; letter-spacing: 8px; font-weight: 700; font-family: 'Courier New', Courier, monospace; margin: 16px 0 10px; }
      @media only screen and (max-width: 600px) {
        .card { padding: 24px; }
        .otp-code { font-size: 30px; letter-spacing: 6px; }
      }
    </style>
  </head>
  <body>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding: 40px 16px; background: radial-gradient(circle at top, rgba(99,102,241,0.45), rgba(15,23,42,0.95));">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px;">
            <tr>
              <td class="card">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="text-align: center; padding-bottom: 28px;">
                      <p style="margin: 0; color: #a5b4fc; font-size: 14px; letter-spacing: 3px; text-transform: uppercase;">Omegoo</p>
                      <h1 style="margin: 12px 0 10px; font-size: 28px; color: #ffffff; font-weight: 700;">${headline}</h1>
                      <p style="margin: 0; color: #cbd5f5; font-size: 16px; line-height: 1.6;">${subHeadline}</p>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div style="background-color: rgba(148, 163, 239, 0.1); border-radius: 16px; padding: 24px;">
                        <p style="margin: 0 0 16px; color: #e2e8f0; font-size: 16px; font-weight: 600;">Here is what awaits you:</p>
                        <div class="feature">
                          <strong style="display: block; color: #e0e7ff;">Instant global matches</strong>
                          <span style="color: #cbd5f5; font-size: 14px;">Meet new people via text, audio, or video within seconds.</span>
                        </div>
                        <div class="feature">
                          <strong style="display: block; color: #e0e7ff;">Smarter, safer chats</strong>
                          <span style="color: #cbd5f5; font-size: 14px;">Community-first moderation keeps conversations respectful.</span>
                        </div>
                        <div class="feature">
                          <strong style="display: block; color: #e0e7ff;">Earn and unlock perks</strong>
                          <span style="color: #cbd5f5; font-size: 14px;">Daily streaks and coins help you explore premium experiences.</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 28px 0 12px; text-align: center;">
                      <a class="button" href="${safePlatformUrl}">Open Omegoo</a>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      ${verificationBlock}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 24px;">
                      <div style="background-color: rgba(15, 23, 42, 0.65); border-radius: 14px; padding: 18px 20px;">
                        <p style="margin: 0 0 8px; font-size: 14px; color: #94a3b8; font-weight: 600;">Need a hand?</p>
                        <p style="margin: 0; color: #cbd5f5; font-size: 14px; line-height: 1.6;">${supportNote} <a href="mailto:support@omegoo.com" style="color: #a5b4fc; text-decoration: none; font-weight: 600;">support@omegoo.com</a>.</p>
                      </div>
                    </td>
                  </tr>
                </table>
                <p style="margin: 26px 0 0; text-align: center; color: #64748b; font-size: 12px;">&copy; ${currentYear} Omegoo. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

const buildPasswordResetEmailTemplate = ({ name, resetUrl }: PasswordResetTemplateArgs): string => {
  const displayName = escapeHtml(name) || 'there';
  const safeResetUrl = escapeHtml(resetUrl);
  const currentYear = new Date().getFullYear();

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset your Omegoo password</title>
    <style>
      body { margin: 0; background-color: #0f172a; color: #e2e8f0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      a.button { display: inline-block; padding: 14px 32px; border-radius: 9999px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-weight: 600; }
      .card { background-color: #111c44; border-radius: 18px; padding: 32px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.35); }
      .notice { background: linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.35) 100%); border-radius: 16px; padding: 24px; color: #e0e7ff; }
      .code { font-size: 15px; letter-spacing: 1px; font-weight: 500; }
      @media only screen and (max-width: 600px) {
        .card { padding: 24px; }
      }
    </style>
  </head>
  <body>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding: 40px 16px; background: radial-gradient(circle at top, rgba(99,102,241,0.45), rgba(15,23,42,0.95));">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px;">
            <tr>
              <td class="card">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="text-align: center; padding-bottom: 28px;">
                      <p style="margin: 0; color: #a5b4fc; font-size: 14px; letter-spacing: 3px; text-transform: uppercase;">Omegoo</p>
                      <h1 style="margin: 12px 0 10px; font-size: 28px; color: #ffffff; font-weight: 700;">Need to reset your password?</h1>
                      <p style="margin: 0; color: #cbd5f5; font-size: 16px; line-height: 1.6;">Hi ${displayName}, tap the button below to create a new password and jump back into the conversation.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 28px 0 12px; text-align: center;">
                      <a class="button" href="${safeResetUrl}">Reset Password</a>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div class="notice">
                        <p style="margin: 0 0 12px; font-size: 15px; font-weight: 600;">Security heads-up</p>
                        <ul style="margin: 0; padding-left: 18px; color: #d1dcff; font-size: 14px; line-height: 1.7;">
                          <li>This link works once and expires in 30 minutes.</li>
                          <li>If you didn’t request a reset, you can safely ignore this email.</li>
                          <li>For extra safety, resetting signs you out of other active sessions.</li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 20px;">
                      <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">If the button doesn’t work, copy and paste this link into your browser:</p>
                      <p class="code" style="margin: 8px 0 0; color: #cbd5f5; word-break: break-all;">${safeResetUrl}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 24px;">
                      <div style="background-color: rgba(15, 23, 42, 0.65); border-radius: 14px; padding: 18px 20px;">
                        <p style="margin: 0 0 8px; font-size: 14px; color: #94a3b8; font-weight: 600;">Need help?</p>
                        <p style="margin: 0; color: #cbd5f5; font-size: 14px; line-height: 1.6;">Reach our safety team anytime at <a href="mailto:support@omegoo.com" style="color: #a5b4fc; text-decoration: none; font-weight: 600;">support@omegoo.com</a>.</p>
                      </div>
                    </td>
                  </tr>
                </table>
                <p style="margin: 26px 0 0; text-align: center; color: #64748b; font-size: 12px;">&copy; ${currentYear} Omegoo. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};
