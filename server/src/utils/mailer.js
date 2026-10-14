const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtpEmail(to, otp, purpose = 'register') {
  const isReset = purpose === 'reset';
  const subject = isReset
    ? 'TaskFlow — Password reset code'
    : 'TaskFlow — Verify your email';

  const headline = isReset ? 'Reset your password' : 'Verify your email';
  const bodyCopy = isReset
    ? 'Use this one-time code to reset your TaskFlow password. It expires in 10 minutes.'
    : 'Welcome to TaskFlow. Enter this code to finish creating your account. It expires in 10 minutes.';

  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; background:#0f1c18; color:#e8f0ec; padding:32px;">
      <div style="max-width:480px;margin:0 auto;background:#162822;border:1px solid #2a4a3e;border-radius:16px;padding:28px;">
        <p style="margin:0 0 8px;letter-spacing:0.18em;text-transform:uppercase;font-size:11px;color:#7dba9e;">TaskFlow</p>
        <h1 style="margin:0 0 12px;font-size:24px;color:#f3faf6;">${headline}</h1>
        <p style="margin:0 0 24px;line-height:1.5;color:#b7cfc4;">${bodyCopy}</p>
        <div style="text-align:center;padding:18px;background:#0f1c18;border-radius:12px;letter-spacing:0.35em;font-size:28px;font-weight:700;color:#5fd4a4;">
          ${otp}
        </div>
        <p style="margin:24px 0 0;font-size:12px;color:#7f998c;">If you did not request this, you can ignore this email.</p>
      </div>
    </div>
  `;

  // Dev fallback: if email credentials are placeholders, log OTP instead of failing hard
  const user = process.env.EMAIL_USER || '';
  const pass = process.env.EMAIL_PASS || '';
  if (
    !user ||
    !pass ||
    user.includes('your_email') ||
    pass.includes('your_gmail')
  ) {
    console.log(`\n[DEV OTP] ${purpose.toUpperCase()} for ${to}: ${otp}\n`);
    return { preview: true, otp };
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  });

  return { preview: false };
}

module.exports = { generateOtp, sendOtpEmail };
