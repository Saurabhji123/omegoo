import { Resend } from 'resend';

// Initialize Resend with API key from environment variable
if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY is not set in environment variables!');
  throw new Error('Missing RESEND_API_KEY in environment configuration');
}

const resend = new Resend(process.env.RESEND_API_KEY);

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
    console.log('📧 Sending OTP email to:', email);
    console.log('📧 OTP:', otp);
    console.log('📧 Name:', name);
    
    const { data, error } = await resend.emails.send({
      from: 'Omegoo <onboarding@resend.dev>',
      to: [email],
      subject: '🎉 आपका Omegoo Verification Code',
      html: `
        <!DOCTYPE html>
        <html lang="hi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Omegoo Email Verification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div style="min-height: 100vh; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); overflow: hidden;">
              
              <!-- Animated Header -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 30px; text-align: center; position: relative;">
                <div style="font-size: 64px; margin-bottom: 10px;">🎉</div>
                <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 700; text-shadow: 0 4px 6px rgba(0,0,0,0.2); letter-spacing: -0.5px;">
                  Omegoo में स्वागत है!
                </h1>
                <p style="margin: 10px 0 0; color: #f0f0f0; font-size: 18px; font-weight: 300;">
                  Welcome to the Future of Connection
                </p>
              </div>

              <!-- Main Content -->
              <div style="padding: 50px 40px;">
                <!-- Greeting -->
                <div style="text-align: center; margin-bottom: 40px;">
                  <h2 style="margin: 0 0 20px; color: #1a202c; font-size: 28px; font-weight: 700;">
                    ${name ? `नमस्ते ${name}! 👋` : 'नमस्ते! 👋'}
                  </h2>
                  <p style="margin: 0 0 15px; color: #4a5568; font-size: 17px; line-height: 1.7;">
                    हमारे community में join करने के लिए धन्यवाद! 🚀
                  </p>
                  <p style="margin: 0; color: #718096; font-size: 15px; line-height: 1.7;">
                    Thank you for joining our amazing community!
                  </p>
                </div>

                <!-- OTP Box with Glow Effect -->
                <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border: 3px solid #667eea; border-radius: 20px; padding: 40px; margin: 40px 0; text-align: center; box-shadow: 0 0 30px rgba(102, 126, 234, 0.2);">
                  <p style="margin: 0 0 20px; color: #2d3748; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">
                    🔐 आपका Verification Code
                  </p>
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 30px; display: inline-block; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);">
                    <p style="margin: 0; color: #ffffff; font-size: 48px; font-weight: 900; letter-spacing: 12px; font-family: 'SF Mono', 'Monaco', 'Courier New', monospace; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                      ${otp}
                    </p>
                  </div>
                  <div style="margin-top: 25px; padding: 15px; background: rgba(102, 126, 234, 0.1); border-radius: 12px;">
                    <p style="margin: 0; color: #5a67d8; font-size: 14px; font-weight: 600;">
                      ⏰ यह code 10 मिनट में expire हो जाएगा
                    </p>
                  </div>
                </div>

                <!-- Security Alert -->
                <div style="background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%); border-left: 5px solid #fc8181; border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 4px 6px rgba(252, 129, 129, 0.1);">
                  <p style="margin: 0 0 15px; color: #742a2a; font-size: 16px; font-weight: 700; display: flex; align-items: center;">
                    <span style="font-size: 24px; margin-right: 10px;">🔐</span>
                    Security के लिए ध्यान दें
                  </p>
                  <ul style="margin: 0; padding-left: 25px; color: #742a2a; font-size: 14px; line-height: 2;">
                    <li><strong>कभी भी</strong> यह OTP किसी के साथ share न करें</li>
                    <li>Omegoo team <strong>कभी नहीं</strong> मांगेगी आपका OTP</li>
                    <li>Suspicious activity मिले तो तुरंत report करें</li>
                  </ul>
                </div>

                <!-- Features Grid -->
                <div style="margin-top: 40px;">
                  <p style="margin: 0 0 25px; color: #2d3748; font-size: 18px; font-weight: 700; text-align: center;">
                    ✨ आपके लिए क्या है Omegoo में:
                  </p>
                  <table cellpadding="0" cellspacing="0" style="width: 100%;">
                    <tr>
                      <td style="padding: 15px; width: 33.33%;">
                        <div style="background: linear-gradient(135deg, #fef5e7 0%, #fadbd8 100%); border-radius: 16px; padding: 20px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                          <div style="font-size: 40px; margin-bottom: 10px;">💬</div>
                          <p style="margin: 0; color: #2d3748; font-size: 14px; font-weight: 700;">Text Chat</p>
                          <p style="margin: 5px 0 0; color: #718096; font-size: 12px;">Instant messaging</p>
                        </div>
                      </td>
                      <td style="padding: 15px; width: 33.33%;">
                        <div style="background: linear-gradient(135deg, #e8f4fd 0%, #d4e6f1 100%); border-radius: 16px; padding: 20px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                          <div style="font-size: 40px; margin-bottom: 10px;">🎙️</div>
                          <p style="margin: 0; color: #2d3748; font-size: 14px; font-weight: 700;">Audio Chat</p>
                          <p style="margin: 5px 0 0; color: #718096; font-size: 12px;">Crystal clear voice</p>
                        </div>
                      </td>
                      <td style="padding: 15px; width: 33.33%;">
                        <div style="background: linear-gradient(135deg, #f4ecf7 0%, #ebdef0 100%); border-radius: 16px; padding: 20px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                          <div style="font-size: 40px; margin-bottom: 10px;">📹</div>
                          <p style="margin: 0; color: #2d3748; font-size: 14px; font-weight: 700;">Video Chat</p>
                          <p style="margin: 5px 0 0; color: #718096; font-size: 12px;">Face to face</p>
                        </div>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin-top: 40px;">
                  <a href="https://omegoo.com" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 50px; font-size: 16px; font-weight: 700; box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4); transition: transform 0.2s;">
                    🚀 Start Chatting Now
                  </a>
                </div>
              </div>

              <!-- Footer -->
              <div style="background-color: #f7fafc; padding: 35px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 15px; color: #718096; font-size: 14px;">
                  Need help? Contact us at <a href="mailto:support@omegoo.com" style="color: #667eea; text-decoration: none; font-weight: 700;">support@omegoo.com</a>
                </p>
                <p style="margin: 15px 0 0; color: #a0aec0; font-size: 13px;">
                  © ${new Date().getFullYear()} Omegoo. Made with ❤️ for connecting people worldwide.
                </p>
                <div style="margin-top: 20px;">
                  <a href="https://omegoo.com" style="color: #667eea; text-decoration: none; margin: 0 12px; font-size: 13px; font-weight: 600;">Website</a>
                  <span style="color: #cbd5e0;">•</span>
                  <a href="https://omegoo.com/privacy" style="color: #667eea; text-decoration: none; margin: 0 12px; font-size: 13px; font-weight: 600;">Privacy</a>
                  <span style="color: #cbd5e0;">•</span>
                  <a href="https://omegoo.com/terms" style="color: #667eea; text-decoration: none; margin: 0 12px; font-size: 13px; font-weight: 600;">Terms</a>
                </div>
              </div>
            </div>
          </div>
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
