import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_MYSPExeX_6ShLVsiRwicTJFYtvxm7eqj6');

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
    const { data, error } = await resend.emails.send({
      from: 'Omegoo <onboarding@resend.dev>', // Replace with your verified domain
      to: [email],
      subject: '🎉 Welcome to Omegoo - Verify Your Email',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - Omegoo</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="min-height: 100vh;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2); overflow: hidden;">
                  
                  <!-- Header with Gradient -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        🎉 Omegoo में आपका स्वागत है!
                      </h1>
                      <p style="margin: 10px 0 0; color: #f0f0f0; font-size: 16px;">
                        Welcome to Omegoo - Connect, Chat, Explore
                      </p>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="margin: 0 0 15px; color: #1a202c; font-size: 24px; font-weight: 600;">
                          ${name ? `नमस्ते ${name}! 👋` : 'नमस्ते! 👋'}
                        </h2>
                        <p style="margin: 0 0 10px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                          Omegoo पर आपका स्वागत है! हमें खुशी है कि आप हमारे community का हिस्सा बने हैं।
                        </p>
                        <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.6;">
                          Thank you for joining Omegoo! We're excited to have you in our community.
                        </p>
                      </div>

                      <!-- OTP Box -->
                      <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border: 3px dashed #667eea; border-radius: 16px; padding: 30px; margin: 30px 0; text-align: center;">
                        <p style="margin: 0 0 15px; color: #2d3748; font-size: 15px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                          आपका Verification Code
                        </p>
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 20px; display: inline-block; box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);">
                          <p style="margin: 0; color: #ffffff; font-size: 42px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                            ${otp}
                          </p>
                        </div>
                        <p style="margin: 15px 0 0; color: #718096; font-size: 13px;">
                          ⏰ यह OTP 10 मिनट के लिए valid है
                        </p>
                      </div>

                      <!-- Instructions -->
                      <div style="background-color: #fff5f5; border-left: 4px solid #fc8181; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <p style="margin: 0 0 10px; color: #742a2a; font-size: 14px; font-weight: 600;">
                          🔐 Security Tips:
                        </p>
                        <ul style="margin: 0; padding-left: 20px; color: #742a2a; font-size: 13px; line-height: 1.8;">
                          <li>यह OTP किसी के साथ share न करें</li>
                          <li>Omegoo team कभी भी आपसे OTP नहीं मांगेगी</li>
                          <li>Suspicious activity दिखे तो तुरंत report करें</li>
                        </ul>
                      </div>

                      <!-- Features -->
                      <div style="margin-top: 30px; text-align: center;">
                        <p style="margin: 0 0 20px; color: #2d3748; font-size: 16px; font-weight: 600;">
                          ✨ Omegoo के साथ करें:
                        </p>
                        <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;">
                          <div style="flex: 1; min-width: 140px; background: linear-gradient(135deg, #fef5e7 0%, #fadbd8 100%); border-radius: 12px; padding: 15px;">
                            <div style="font-size: 32px; margin-bottom: 5px;">💬</div>
                            <p style="margin: 0; color: #2d3748; font-size: 13px; font-weight: 600;">Text Chat</p>
                          </div>
                          <div style="flex: 1; min-width: 140px; background: linear-gradient(135deg, #e8f4fd 0%, #d4e6f1 100%); border-radius: 12px; padding: 15px;">
                            <div style="font-size: 32px; margin-bottom: 5px;">🎙️</div>
                            <p style="margin: 0; color: #2d3748; font-size: 13px; font-weight: 600;">Audio Chat</p>
                          </div>
                          <div style="flex: 1; min-width: 140px; background: linear-gradient(135deg, #f4ecf7 0%, #ebdef0 100%); border-radius: 12px; padding: 15px;">
                            <div style="font-size: 32px; margin-bottom: 5px;">📹</div>
                            <p style="margin: 0; color: #2d3748; font-size: 13px; font-weight: 600;">Video Chat</p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0 0 10px; color: #718096; font-size: 14px;">
                        Questions? Contact us at <a href="mailto:support@omegoo.com" style="color: #667eea; text-decoration: none; font-weight: 600;">support@omegoo.com</a>
                      </p>
                      <p style="margin: 10px 0 0; color: #a0aec0; font-size: 12px;">
                        © 2024 Omegoo. Made with ❤️ for LPU students and beyond.
                      </p>
                      <div style="margin-top: 15px;">
                        <a href="https://omegoo.com" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 12px;">Website</a>
                        <span style="color: #cbd5e0;">|</span>
                        <a href="https://omegoo.com/privacy" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 12px;">Privacy</a>
                        <span style="color: #cbd5e0;">|</span>
                        <a href="https://omegoo.com/terms" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 12px;">Terms</a>
                      </div>
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
      console.error('❌ Error sending OTP email:', error);
      return false;
    }

    console.log('✅ OTP email sent successfully:', data);
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
    const { data, error } = await resend.emails.send({
      from: 'Omegoo <onboarding@resend.dev>',
      to: [email],
      subject: '🎉 Welcome to Omegoo!',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Omegoo</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="min-height: 100vh;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        🎉 स्वागत है!
                      </h1>
                      <p style="margin: 15px 0 0; color: #f0f0f0; font-size: 18px;">
                        Welcome to Omegoo Community
                      </p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 50px 30px; text-align: center;">
                      <h2 style="margin: 0 0 20px; color: #1a202c; font-size: 26px; font-weight: 600;">
                        ${name ? `नमस्ते ${name}! 👋` : 'Hello! 👋'}
                      </h2>
                      <p style="margin: 0 0 15px; color: #4a5568; font-size: 17px; line-height: 1.7;">
                        आपका account successfully verified हो गया है! 🎊
                      </p>
                      <p style="margin: 0 0 30px; color: #718096; font-size: 15px; line-height: 1.7;">
                        Ab आप Omegoo की सभी features का मजा ले सकते हैं।
                      </p>

                      <!-- Features Grid -->
                      <div style="margin: 40px 0;">
                        <p style="margin: 0 0 25px; color: #2d3748; font-size: 18px; font-weight: 600;">
                          ✨ Omegoo Features:
                        </p>
                        <div style="text-align: left; max-width: 400px; margin: 0 auto;">
                          <div style="background: linear-gradient(135deg, #fef5e7 0%, #fadbd8 100%); border-radius: 12px; padding: 20px; margin-bottom: 15px;">
                            <p style="margin: 0; color: #2d3748; font-size: 18px; font-weight: 600;">💬 Text Chat</p>
                            <p style="margin: 5px 0 0; color: #718096; font-size: 14px;">Strangers के साथ instant messaging</p>
                          </div>
                          <div style="background: linear-gradient(135deg, #e8f4fd 0%, #d4e6f1 100%); border-radius: 12px; padding: 20px; margin-bottom: 15px;">
                            <p style="margin: 0; color: #2d3748; font-size: 18px; font-weight: 600;">🎙️ Audio Chat</p>
                            <p style="margin: 5px 0 0; color: #718096; font-size: 14px;">Voice conversations with random people</p>
                          </div>
                          <div style="background: linear-gradient(135deg, #f4ecf7 0%, #ebdef0 100%); border-radius: 12px; padding: 20px;">
                            <p style="margin: 0; color: #2d3748; font-size: 18px; font-weight: 600;">📹 Video Chat</p>
                            <p style="margin: 5px 0 0; color: #718096; font-size: 14px;">Face-to-face conversations worldwide</p>
                          </div>
                        </div>
                      </div>

                      <!-- CTA Button -->
                      <a href="https://omegoo.com" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; margin-top: 20px; box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);">
                        🚀 Start Chatting Now
                      </a>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0 0 10px; color: #718096; font-size: 14px;">
                        Need help? Contact <a href="mailto:support@omegoo.com" style="color: #667eea; text-decoration: none; font-weight: 600;">support@omegoo.com</a>
                      </p>
                      <p style="margin: 10px 0 0; color: #a0aec0; font-size: 12px;">
                        © 2024 Omegoo. Made with ❤️ for LPU students.
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
