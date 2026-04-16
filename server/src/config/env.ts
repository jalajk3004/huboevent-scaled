import 'dotenv/config';

interface Config {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  paytm: { mid: string; merchantKey: string; website: string; host: string };
  jwt: { secret: string; expiresIn: string };
  admin: { email: string; password: string };
  whatsapp: { accessToken: string; phoneNumberId: string };
}

const required = [
  'DATABASE_URL',
  'PAYTM_MID', 'PAYTM_MERCHANT_KEY',
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

  paytm: {
    mid: process.env.PAYTM_MID!,
    merchantKey: process.env.PAYTM_MERCHANT_KEY!,
    website: process.env.PAYTM_WEBSITE ?? 'DEFAULT',
    host: process.env.PAYTM_HOST ?? 'https://securestage.paytmpayments.com',
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
