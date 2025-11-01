import { Resend } from 'resend';

// Initialize Resend with API key from environment variable
// IMPORTANT: Do NOT throw at module load time — this breaks server startup on Render if the key isn't set.
// Instead, degrade gracefully and no-op the email functions while logging clear warnings.
const HAS_RESEND_KEY = !!process.env.RESEND_API_KEY;
let resend: Resend | null = null;

if (HAS_RESEND_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn('⚠️ RESEND_API_KEY is not set. Email sending is disabled. Set RESEND_API_KEY in your environment to enable emails.');
}

interface SendOTPEmailParams {
  email: string;
  otp: string;
  name?: string;
}

interface SendWelcomeEmailParams {
  email: string;
  name?: string;
}

/**
 * Generate 6-digit OTP
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP email for email verification
 */
export const sendOTPEmail = async ({ email, otp, name }: SendOTPEmailParams): Promise<boolean> => {
  try {
    if (!resend) {
      // Graceful degradation: don't fail server logic, just log and report false
      console.warn(`⚠️ Skipping OTP email (RESEND_API_KEY missing). Intended recipient: ${email}, OTP: ${otp}`);
      return false;
    }
    console.log('📧 Sending OTP email to:', email);
    console.log('📧 OTP:', otp);
    console.log('📧 Name:', name);
    
    const { data, error } = await resend.emails.send({
      from: 'Omegoo <onboarding@resend.dev>',
      to: [email],
      subject: 'Verify Your Omegoo Account',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - Omegoo</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7f9fc;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f7f9fc; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                        Welcome to Omegoo
                      </h1>
                      <p style="margin: 10px 0 0; color: #f0f0f0; font-size: 16px; font-weight: 300;">
                        Connect with people worldwide
                      </p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px; color: #1a202c; font-size: 16px; line-height: 1.6;">
                        Hello <strong>${name || 'there'}</strong>,
                      </p>
                      <p style="margin: 0 0 20px; color: #4a5568; font-size: 15px; line-height: 1.7;">
                        Thank you for signing up! To complete your registration and start connecting with people, please verify your email address using the code below.
                      </p>

                      <!-- OTP Box -->
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
                        <tr>
                          <td style="background-color: #f7fafc; border: 2px solid #667eea; border-radius: 12px; padding: 30px; text-align: center;">
                            <p style="margin: 0 0 15px; color: #2d3748; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                              Your Verification Code
                            </p>
                            <p style="margin: 0; color: #667eea; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                              ${otp}
                            </p>
                            <p style="margin: 15px 0 0; color: #718096; font-size: 13px;">
                              Valid for 10 minutes
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Instructions -->
                      <div style="background-color: #edf2f7; border-left: 4px solid #667eea; border-radius: 8px; padding: 20px; margin: 25px 0;">
                        <p style="margin: 0 0 12px; color: #2d3748; font-size: 14px; font-weight: 600;">
                          Important Notes:
                        </p>
                        <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 14px; line-height: 1.8;">
                          <li>This code expires in 10 minutes</li>
                          <li>Never share this code with anyone</li>
                          <li>If you didn't request this, please ignore this email</li>
                          <li><strong>Check your spam folder</strong> if you don't see our emails in your inbox</li>
                        </ul>
                      </div>

                      <p style="margin: 25px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                        Once verified, you'll have access to:
                      </p>
                      <ul style="margin: 10px 0 0; padding-left: 20px; color: #4a5568; font-size: 14px; line-height: 1.8;">
                        <li>Text, audio, and video chat</li>
                        <li>Match with random people worldwide</li>
                        <li>Safe and moderated conversations</li>
                      </ul>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0 0 10px; color: #718096; font-size: 14px;">
                        Need help? Contact us at <a href="mailto:support@omegoo.com" style="color: #667eea; text-decoration: none; font-weight: 600;">support@omegoo.com</a>
                      </p>
                      <p style="margin: 15px 0 0; color: #a0aec0; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} Omegoo. All rights reserved.
                      </p>
                      <p style="margin: 10px 0 0; color: #cbd5e0; font-size: 11px;">
                        This is an automated email. Please do not reply.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      return false;
    }

    console.log('✅ Email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    return false;
  }
};

/**
 * Send welcome email for Google OAuth users (no OTP needed)
 */
export const sendWelcomeEmail = async ({ email, name }: SendWelcomeEmailParams): Promise<boolean> => {
  try {
    if (!resend) {
      console.warn(`⚠️ Skipping welcome email (RESEND_API_KEY missing). Intended recipient: ${email}`);
      return false;
    }
    const { data, error } = await resend.emails.send({
      from: 'Omegoo <onboarding@resend.dev>',
      to: [email],
      subject: 'Welcome to Omegoo - Your Account is Ready',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Omegoo</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7f9fc;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f7f9fc; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                        Welcome to Omegoo
                      </h1>
                      <p style="margin: 10px 0 0; color: #f0f0f0; font-size: 16px; font-weight: 300;">
                        Your account is ready to use
                      </p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px; color: #1a202c; font-size: 16px; line-height: 1.6;">
                        Hello <strong>${name || 'there'}</strong>,
                      </p>
                      <p style="margin: 0 0 20px; color: #4a5568; font-size: 15px; line-height: 1.7;">
                        Your Google account has been successfully verified. You can now start connecting with people from around the world.
                      </p>

                      <!-- Features -->
                      <div style="margin: 30px 0;">
                        <p style="margin: 0 0 20px; color: #2d3748; font-size: 16px; font-weight: 600;">
                          What you can do on Omegoo:
                        </p>
                        
                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td style="padding: 15px; background-color: #f7fafc; border-radius: 8px; margin-bottom: 10px;">
                              <p style="margin: 0 0 5px; color: #2d3748; font-size: 15px; font-weight: 600;">Text Chat</p>
                              <p style="margin: 0; color: #718096; font-size: 14px;">Connect instantly via messages</p>
                            </td>
                          </tr>
                          <tr><td style="height: 10px;"></td></tr>
                          <tr>
                            <td style="padding: 15px; background-color: #f7fafc; border-radius: 8px;">
                              <p style="margin: 0 0 5px; color: #2d3748; font-size: 15px; font-weight: 600;">Audio Chat</p>
                              <p style="margin: 0; color: #718096; font-size: 14px;">Crystal clear voice conversations</p>
                            </td>
                          </tr>
                          <tr><td style="height: 10px;"></td></tr>
                          <tr>
                            <td style="padding: 15px; background-color: #f7fafc; border-radius: 8px;">
                              <p style="margin: 0 0 5px; color: #2d3748; font-size: 15px; font-weight: 600;">Video Chat</p>
                              <p style="margin: 0; color: #718096; font-size: 14px;">Face-to-face with strangers worldwide</p>
                            </td>
                          </tr>
                        </table>
                      </div>

                      <!-- CTA Button -->
                      <div style="text-align: center; margin: 35px 0;">
                        <a href="https://omegoo.com" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                          Start Chatting
                        </a>
                      </div>

                      <p style="margin: 25px 0 0; color: #718096; font-size: 14px; line-height: 1.6; text-align: center;">
                        Stay safe and have fun connecting!
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0 0 10px; color: #718096; font-size: 14px;">
                        Need help? Contact us at <a href="mailto:support@omegoo.com" style="color: #667eea; text-decoration: none; font-weight: 600;">support@omegoo.com</a>
                      </p>
                      <p style="margin: 15px 0 0; color: #a0aec0; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} Omegoo. All rights reserved.
                      </p>
                      <p style="margin: 10px 0 0; color: #cbd5e0; font-size: 11px;">
                        This is an automated email. Please do not reply.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Error sending welcome email:', error);
      return false;
    }

    console.log('✅ Welcome email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return false;
  }
};
