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
      from: 'Omegoo <noreply@omegoo.chat>', // send from verified Omegoo domain
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
      from: 'Omegoo <noreply@omegoo.chat>',
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
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Verify Your Email - Omegoo</title>
        <style>
          body { margin: 0; padding: 0; font-family: 'Inter', 'Segoe UI', sans-serif; background-color: #0f172a; color: #0f172a; }
          .wrapper { width: 100%; background-color: #0f172a; padding: 40px 16px; }
          .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 22px 60px rgba(15, 23, 42, 0.25); }
          .hero { background: radial-gradient(120% 120% at 50% 0%, #6d28d9 0%, #1e1b4b 65%); padding: 48px 32px; text-align: center; }
          .hero h1 { margin: 0; font-size: 30px; line-height: 1.3; color: #f8fafc; font-weight: 700; }
          .hero p { margin: 12px 0 0; color: rgba(248, 250, 252, 0.78); font-size: 16px; }
          .content { padding: 40px 32px 32px; }
          .content p { margin: 0 0 18px; font-size: 16px; color: #1e293b; line-height: 1.65; }
          .otp-box { margin: 32px 0; background: linear-gradient(135deg, #8b5cf6, #6366f1); border-radius: 20px; padding: 28px; text-align: center; }
          .otp-label { margin: 0 0 12px; text-transform: uppercase; letter-spacing: 3px; font-size: 13px; color: rgba(248, 250, 252, 0.78); }
          .otp-code { display: inline-block; padding: 22px 32px; border-radius: 16px; background: #ffffff; font-size: 42px; letter-spacing: 10px; font-weight: 700; color: #4338ca; font-family: 'SFMono-Regular', 'Menlo', monospace; }
          .note { margin-top: 16px; font-size: 14px; color: rgba(248, 250, 252, 0.88); }
          .alert { background: rgba(99, 102, 241, 0.08); border-left: 4px solid #6366f1; border-radius: 12px; padding: 18px 20px; font-size: 14px; color: #334155; line-height: 1.6; }
          .footer { background: #f8fafc; padding: 28px 32px; text-align: center; font-size: 12px; color: #64748b; }
          @media (max-width: 480px) {
            .hero { padding: 36px 24px; }
            .hero h1 { font-size: 26px; }
            .content { padding: 32px 24px 24px; }
            .otp-code { font-size: 32px; letter-spacing: 6px; padding: 20px 24px; }
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td align="center">
                <div class="card">
                  <div class="hero">
                    <h1>Omegoo में आपका हार्दिक स्वागत है!</h1>
                    <p>Let’s secure your account in under a minute.</p>
                  </div>
                  <div class="content">
                    <p>नमस्ते <strong>${name}</strong>,</p>
                    <p>
                      आपके लिए Omegoo की दुनिया का दरवाजा खुल चुका है! 🚀
                      नीचे दिया गया verification code 10 मिनट तक मान्य रहेगा।
                    </p>
                    <div class="otp-box">
                      <p class="otp-label">Verification Code</p>
                      <span class="otp-code">${otp}</span>
                      <p class="note">⏱️ OTP विफल होने से पहले इसे पूरा कर लें</p>
                    </div>
                    <div class="alert">
                      <strong>Security Tip:</strong> यह OTP सिर्फ आपके लिए है।
                      कोई भी Omegoo टीम सदस्य इसे कभी नहीं मांगेगा।
                    </div>
                    <p>यदि आपने इस signup की शुरुआत नहीं की है, तो निश्चिंत रहें — आप इस ईमेल को अनदेखा कर सकते हैं।</p>
                    <p style="margin-top:28px;">शुभकामनाएं,<br/><strong>Team Omegoo</strong></p>
                  </div>
                  <div class="footer">
                    यह एक system generated ईमेल है। कृपया reply न करें।<br/>
                    © ${new Date().getFullYear()} Omegoo Chat. All rights reserved.
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </div>
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
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Welcome to Omegoo</title>
        <style>
          body { margin: 0; padding: 0; font-family: 'Inter', 'Segoe UI', sans-serif; background-color: #0f172a; color: #0f172a; }
          .wrapper { width: 100%; background-color: #0f172a; padding: 40px 16px; }
          .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 22px 60px rgba(15, 23, 42, 0.25); }
          .hero { background: radial-gradient(120% 120% at 50% 0%, #6d28d9 0%, #1e1b4b 65%); padding: 48px 32px; text-align: center; }
          .hero h1 { margin: 0; font-size: 30px; line-height: 1.3; color: #f8fafc; font-weight: 700; }
          .hero p { margin: 12px 0 0; color: rgba(248, 250, 252, 0.78); font-size: 16px; }
          .content { padding: 40px 32px 32px; }
          .content p { margin: 0 0 18px; font-size: 16px; color: #1e293b; line-height: 1.65; }
          .cta { margin: 32px 0; background: linear-gradient(135deg, #8b5cf6, #6366f1); border-radius: 20px; padding: 28px; text-align: center; color: #f8fafc; }
          .cta h2 { margin: 0; font-size: 24px; font-weight: 600; }
          .cta p { margin: 12px 0 0; font-size: 16px; color: rgba(248, 250, 252, 0.85); }
          .benefits { background: rgba(99, 102, 241, 0.08); border-radius: 16px; padding: 22px 24px; margin-top: 20px; }
          .benefits h3 { margin: 0 0 12px; font-size: 17px; color: #4338ca; }
          .benefits ul { padding-left: 20px; margin: 0; color: #475569; line-height: 1.8; }
          .footer { background: #f8fafc; padding: 28px 32px; text-align: center; font-size: 12px; color: #64748b; }
          @media (max-width: 480px) {
            .hero { padding: 36px 24px; }
            .hero h1 { font-size: 26px; }
            .content { padding: 32px 24px 24px; }
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td align="center">
                <div class="card">
                  <div class="hero">
                    <h1>Welcome to Omegoo!</h1>
                    <p>नए connections, smarter conversations.</p>
                  </div>
                  <div class="content">
                    <p>Hey <strong>${name}</strong>,</p>
                    <p>
                      Google से successful sign-in के लिए बधाई! अब आप Omegoo के सभी
                      AI-powered experiences explore कर सकते हैं।
                    </p>
                    <div class="cta">
                      <h2>🚀 You’re ready to chat!</h2>
                      <p>अपनी complimentary welcome credits के साथ शुरुआत करें।</p>
                    </div>
                    <div class="benefits">
                      <h3>जल्दी से शुरुआत करने के लिए:</h3>
                      <ul>
                        <li>AI experts से instant replies</li>
                        <li>Smart prompts & personalised threads</li>
                        <li>Daily rewards and community events</li>
                      </ul>
                    </div>
                    <p style="margin-top: 28px;">Stay curious,<br/><strong>Team Omegoo</strong></p>
                  </div>
                  <div class="footer">
                    कोई सवाल? support@omegoo.chat पर लिखें।<br/>
                    © ${new Date().getFullYear()} Omegoo Chat. All rights reserved.
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;
}
