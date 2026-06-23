import mongoose from 'mongoose';
import config from '../config/index.js';
import { logger } from '../shared/utils/logger.js';

const RECONNECT_DELAY = 10000; // Cố định 10 giây (10000 ms)
let isReconnecting = false;

export async function connectDB() {
  try {
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000, // Quá 5 giây không thấy DB thì báo lỗi để kích hoạt reconnect
    });
    logger.info('MongoDB connected successfully');
    isReconnecting = false;
  } catch (error) {
    logger.error({ err: error }, 'MongoDB connection failed');
    handleReconnect();
  }
}

function handleReconnect() {
  if (isReconnecting) return;
  isReconnecting = true;

  logger.warn('Sẽ thử kết nối lại sau 10 giây...');

  setTimeout(async () => {
    isReconnecting = false;
    await connectDB();
  }, RECONNECT_DELAY);
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
  handleReconnect();
});

mongoose.connection.on('error', (err) => {
  logger.error({ err }, 'MongoDB connection error');
});
