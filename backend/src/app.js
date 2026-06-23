import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './services/auth/auth.routes.js';
import userRoutes from './services/users/users.routes.js';
import productRoutes from './services/products/products.routes.js';
import cartRoutes from './services/cart/cart.routes.js';
import orderRoutes from './services/orders/orders.routes.js';
import paymentRoutes from './services/payments/payments.routes.js';
import settingsRoutes from './services/settings/settings.routes.js';
import dashboardRoutes from './services/dashboard/dashboard.routes.js';

const app = express();

// CORS
app.use(
  cors({
    origin: config.frontendOrigin,
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(cookieParser());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', paymentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

export default app;