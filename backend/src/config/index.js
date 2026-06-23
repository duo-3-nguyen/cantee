import 'dotenv/config';

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cantee_db',
  session: {
    cookieName: process.env.SESSION_COOKIE_NAME || 'cantee_sid',
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    ttlDays: parseInt(process.env.SESSION_TTL_DAYS, 10) || 7,
  },
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin@123456',
    adminFullName: process.env.SEED_ADMIN_FULL_NAME || 'System Admin',
  },
};

export default config;