
const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

async function sendActionEmail({ to, subject, text }) {
  if (resend) {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'PocketWise <onboarding@resend.dev>',
      to,
      subject,
      text,
    });

    if (error) {
      console.error('Resend email error:', error);
      throw new Error('Failed to send email.');
    }

    console.log('Email sent successfully:', data.id);
    return data;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(
      `\n[EMAIL PREVIEW]\nTo: ${to}\nSubject: ${subject}\n${text}\n`
    );
    return;
  }

  throw new Error('Email service is not configured.');
}

module.exports = sendActionEmail;
