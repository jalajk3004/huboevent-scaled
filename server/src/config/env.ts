import 'dotenv/config';

interface Config {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  razorpay: { keyId: string; keySecret: string; webhookSecret: string };
  jwt: { secret: string; expiresIn: string };
  admin: { email: string; password: string };
  whatsapp: { accessToken: string; phoneNumberId: string };
}

const required = [
  'DATABASE_URL',
  'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET',
  'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD',
  'META_WA_ACCESS_TOKEN', 'META_WA_PHONE_NUMBER_ID',
] as const;

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[CONFIG] WARNING: Missing env variable: ${key}`);
  }
}

const config: Config = {
  port: parseInt(process.env.PORT ?? '5000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID!,
    keySecret: process.env.RAZORPAY_KEY_SECRET!,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',
  },

  jwt: {
    secret: process.env.JWT_SECRET ?? 'fallback_secret_for_development',
    expiresIn: '1d',
  },

  admin: {
    email: process.env.ADMIN_EMAIL!,
    password: process.env.ADMIN_PASSWORD!,
  },

  whatsapp: {
    accessToken: process.env.META_WA_ACCESS_TOKEN!,
    phoneNumberId: process.env.META_WA_PHONE_NUMBER_ID!,
  },
};

export default config;
