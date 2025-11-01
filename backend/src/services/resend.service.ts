import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendOTPEmailParams {
  email: string;
  otp: string;
  name: string;
}

/**
 * Send OTP verification email using Resend
 */
export const sendOTPEmail = async ({ email, otp, name }: SendOTPEmailParams): Promise<boolean> => {
  try {
    console.log('📧 Sending OTP email via Resend...');
    console.log('Recipient:', email);
    console.log('OTP:', otp);

    const { data, error } = await resend.emails.send({
      from: 'Omegoo <onboarding@resend.dev>', // Resend's default verified sender
      to: [email],
      subject: '🎉 Welcome to Omegoo - Verify Your Email',
      html: generateOTPEmailHTML(name, otp),
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      return false;
    }

    console.log('✅ OTP email sent successfully');
    console.log('Email ID:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    return false;
  }
};

/**
 * Send welcome email for Google OAuth users (no OTP)
 */
export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
  try {
    console.log('📧 Sending welcome email via Resend...');
    console.log('Recipient:', email);

    const { data, error } = await resend.emails.send({
      from: 'Omegoo <onboarding@resend.dev>',
      to: [email],
      subject: '🎉 Welcome to Omegoo!',
      html: generateWelcomeEmailHTML(name),
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      return false;
    }

    console.log('✅ Welcome email sent successfully');
    console.log('Email ID:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return false;
  }
};

/**
 * Generate OTP verification email HTML
 */
function generateOTPEmailHTML(name: string, otp: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - Omegoo</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
          <tr>
            <td align="center">
              <!-- Email Container -->
              <table role="presentation" style="max-width: 600px; width: 100%; background: white; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); overflow: hidden;">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: white; font-size: 36px; font-weight: bold;">
                      🎉 Omegoo में आपका स्वागत है!
                    </h1>
                    <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 18px;">
                      Welcome to Omegoo Chat
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333; line-height: 1.6;">
                      नमस्ते <strong>${name}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333; line-height: 1.6;">
                      Omegoo में आपका स्वागत है! 🚀 हम बहुत खुश हैं कि आप हमारे साथ जुड़े। 
                      अपना अकाउंट activate करने के लिए नीचे दिया गया OTP use करें।
                    </p>

                    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 15px; padding: 30px; margin: 30px 0; text-align: center;">
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: white; text-transform: uppercase; letter-spacing: 2px;">
                        Your Verification Code
                      </p>
                      <div style="background: white; border-radius: 10px; padding: 20px; display: inline-block;">
                        <h2 style="margin: 0; font-size: 48px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                          ${otp}
                        </h2>
                      </div>
                      <p style="margin: 15px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.9);">
                        ⏰ यह OTP 10 मिनट में expire हो जाएगा
                      </p>
                    </div>

                    <div style="background: #f8f9fa; border-left: 4px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0;">
                      <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.6;">
                        <strong>🔒 Security Tip:</strong> Omegoo कभी भी phone या email से आपका OTP नहीं मांगेगा। 
                        अगर किसी ने माँगा तो share मत करना!
                      </p>
                    </div>

                    <p style="margin: 20px 0 0 0; font-size: 16px; color: #333; line-height: 1.6;">
                      अगर आपने यह registration request नहीं किया है, तो इस email को ignore करें।
                    </p>

                    <p style="margin: 30px 0 0 0; font-size: 16px; color: #333;">
                      धन्यवाद,<br>
                      <strong style="color: #667eea;">Team Omegoo</strong> 💜
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #6c757d;">
                      यह एक automated message है। कृपया इस email का reply मत करें।
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #adb5bd;">
                      © 2024 Omegoo Chat. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

/**
 * Generate welcome email HTML for Google OAuth users
 */
function generateWelcomeEmailHTML(name: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Omegoo</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" style="max-width: 600px; width: 100%; background: white; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); overflow: hidden;">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: white; font-size: 36px; font-weight: bold;">
                      🎉 Welcome to Omegoo!
                    </h1>
                    <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 18px;">
                      आपका स्वागत है!
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333; line-height: 1.6;">
                      नमस्ते <strong>${name}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333; line-height: 1.6;">
                      Omegoo में आपका स्वागत है! 🎊 आपने successfully Google से sign up कर लिया है।
                    </p>

                    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 15px; padding: 30px; margin: 30px 0; text-align: center;">
                      <h2 style="margin: 0; color: white; font-size: 24px;">
                        🚀 आप अब chat करने के लिए ready हैं!
                      </h2>
                      <p style="margin: 15px 0 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">
                        50 free coins के साथ start करें
                      </p>
                    </div>

                    <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0;">
                      <h3 style="margin: 0 0 15px 0; color: #667eea; font-size: 18px;">
                        🎁 Welcome Bonus:
                      </h3>
                      <ul style="margin: 0; padding-left: 20px; color: #555; line-height: 2;">
                        <li>50 Free Coins</li>
                        <li>Unlimited Daily Chats</li>
                        <li>Access to All Features</li>
                      </ul>
                    </div>

                    <p style="margin: 30px 0 0 0; font-size: 16px; color: #333;">
                      हमारे साथ जुड़ने के लिए धन्यवाद!<br>
                      <strong style="color: #667eea;">Team Omegoo</strong> 💜
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="margin: 0; font-size: 12px; color: #adb5bd;">
                      © 2024 Omegoo Chat. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
