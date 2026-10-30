type PasswordResetLocale = 'fr' | 'en';

const EMAIL_SUBJECT: Record<PasswordResetLocale, string> = {
  fr: 'Réinitialisation de votre mot de passe AVS',
  en: 'Reset your AVS password',
};

const EMAIL_COPY: Record<
  PasswordResetLocale,
  { greeting: string; instruction: string; expiry: string; ignore: string }
> = {
  fr: {
    greeting: 'Bonjour,',
    instruction:
      'Utilisez le lien ci-dessous pour choisir un nouveau mot de passe. Ce lien expirera dans une heure.',
    expiry: 'Réinitialiser mon mot de passe',
    ignore: 'Si vous n’avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail.',
  },
  en: {
    greeting: 'Hello,',
    instruction: 'Use the link below to choose a new password. This link expires in one hour.',
    expiry: 'Reset my password',
    ignore: 'If you did not request this reset, you can ignore this email.',
  },
};

export function isPasswordResetEmailConfigured(): boolean {
  return Boolean(
    (process.env.RESEND_API_KEY ?? process.env.SMTP_PASS) &&
    process.env.EMAIL_FROM &&
    process.env.FRONTEND_URL,
  );
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  locale: PasswordResetLocale,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY ?? process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM;
  const frontendUrl = process.env.FRONTEND_URL;

  if (!apiKey || !from || !frontendUrl) throw new Error('Password reset email is not configured.');

  const baseUrl = new URL(frontendUrl);
  if (baseUrl.protocol !== 'https:' && baseUrl.hostname !== 'localhost') {
    throw new Error('FRONTEND_URL must use HTTPS outside localhost.');
  }

  const resetUrl = new URL(`/${locale}/auth/reset-password`, baseUrl);
  resetUrl.searchParams.set('token', token);

  const copy = EMAIL_COPY[locale];
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: EMAIL_SUBJECT[locale],
      html: `<p>${copy.greeting}</p><p>${copy.instruction}</p><p><a href="${resetUrl.toString()}">${copy.expiry}</a></p><p>${copy.ignore}</p>`,
      text: `${copy.greeting}\n\n${copy.instruction}\n\n${copy.expiry}: ${resetUrl.toString()}\n\n${copy.ignore}`,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Password reset email provider returned HTTP ${response.status}.`);
  }
}
