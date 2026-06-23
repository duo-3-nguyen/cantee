import 'dotenv/config';
import { connectDB } from './db/connection.js';
import config from './config/index.js';
import { logger } from './shared/utils/logger.js';
import { User } from './services/users/users.model.js';
import { CanteenSettings } from './services/settings/settings.model.js';
import { Product } from './services/products/products.model.js';
import argon2 from 'argon2';

async function seed() {
  await connectDB();

  logger.info('Seeding database...');

  // Seed admin user
  const existingAdmin = await User.findOne({ email: config.seed.adminEmail });
  if (!existingAdmin) {
    const passwordHash = await argon2.hash(config.seed.adminPassword);
    await User.create({
      email: config.seed.adminEmail,
      passwordHash,
      fullName: config.seed.adminFullName,
      role: 'admin',
      status: 'active',
    });
    logger.info(`Admin user created: ${config.seed.adminEmail}`);
  } else {
    logger.info('Admin user already exists, skipping');
  }

  // Seed default canteen settings
  const existingSettings = await CanteenSettings.findOne();
  if (!existingSettings) {
    await CanteenSettings.create({
      canteenName: 'CMC Main Canteen',
      address: 'Default Address',
      timezone: 'Asia/Ho_Chi_Minh',
      openingHours: [
        { dayOfWeek: 0, isOpen: false, openTime: null, closeTime: null },
        { dayOfWeek: 1, isOpen: true, openTime: '07:00', closeTime: '17:00' },
        { dayOfWeek: 2, isOpen: true, openTime: '07:00', closeTime: '17:00' },
        { dayOfWeek: 3, isOpen: true, openTime: '07:00', closeTime: '17:00' },
        { dayOfWeek: 4, isOpen: true, openTime: '07:00', closeTime: '17:00' },
        { dayOfWeek: 5, isOpen: true, openTime: '07:00', closeTime: '17:00' },
        { dayOfWeek: 6, isOpen: true, openTime: '07:00', closeTime: '12:00' },
      ],
    });
    logger.info('Default canteen settings created');
  } else {
    logger.info('Canteen settings already exist, skipping');
  }

  // Seed example products (only if no products exist)
  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    const admin = await User.findOne({ role: 'admin' });
    const adminId = admin._id;

    const products = [
      {
        name: 'Cơm Gà',
        description: 'Cơm gà với nước mắm chua ngọt',
        basePriceAmount: 30000,
        status: 'available',
        createdBy: adminId,
        updatedBy: adminId,
        modifierGroups: [
          {
            groupId: 'them',
            name: 'Thêm',
            modifiers: [
              { modifierId: 'them-com', name: 'Thêm cơm', priceAmount: 5000, isActive: true },
              { modifierId: 'them-ga', name: 'Thêm gà', priceAmount: 15000, isActive: true },
            ],
            defaultModifierIds: [],
            minSelected: 0,
            maxSelected: 2,
          },
          {
            groupId: 'canh',
            name: 'Lựa chọn canh',
            modifiers: [
              { modifierId: 'canh-chua', name: 'Canh chua', priceAmount: 0, isActive: true },
              { modifierId: 'canh-rau', name: 'Canh rau', priceAmount: 0, isActive: true },
            ],
            defaultModifierIds: ['canh-chua'],
            minSelected: 1,
            maxSelected: 1,
          },
        ],
      },
      {
        name: 'Bún Chả Giò Thịt Nướng',
        description: 'Bún tươi với chả giò và thịt nướng',
        basePriceAmount: 25000,
        status: 'available',
        createdBy: adminId,
        updatedBy: adminId,
        modifierGroups: [
          {
            groupId: 'kich-co',
            name: 'Kích cỡ',
            modifiers: [
              { modifierId: 'them-bun', name: 'Thêm bún', priceAmount: 5000, isActive: true },
            ],
            defaultModifierIds: [],
            minSelected: 0,
            maxSelected: 1,
          },
          {
            groupId: 'topping',
            name: 'Topping',
            modifiers: [
              { modifierId: 'them-cha-gio', name: 'Thêm chả giò', priceAmount: 10000, isActive: true },
            ],
            defaultModifierIds: [],
            minSelected: 0,
            maxSelected: 1,
          },
          {
            groupId: 'rau',
            name: 'Yêu cầu rau',
            modifiers: [
              { modifierId: 'khong-gia', name: 'Không giá', priceAmount: 0, isActive: true },
            ],
            defaultModifierIds: [],
            minSelected: 0,
            maxSelected: 1,
          },
        ],
      },
      {
        name: 'Sữa Đậu Nành',
        description: 'Sữa đậu nành tươi',
        basePriceAmount: 10000,
        status: 'available',
        createdBy: adminId,
        updatedBy: adminId,
        modifierGroups: [
          {
            groupId: 'do-ngot',
            name: 'Mức độ ngọt',
            modifiers: [
              { modifierId: 'nhieu-duong', name: 'Nhiều đường', priceAmount: 0, isActive: true },
              { modifierId: 'khong-duong', name: 'Không đường', priceAmount: 0, isActive: true },
            ],
            defaultModifierIds: ['nhieu-duong'],
            minSelected: 1,
            maxSelected: 1,
          },
          {
            groupId: 'nhiet-do',
            name: 'Nhiệt độ',
            modifiers: [
              { modifierId: 'thuong', name: 'Thường', priceAmount: 0, isActive: true },
              { modifierId: 'uong-da', name: 'Uống đá', priceAmount: 0, isActive: true },
              { modifierId: 'uong-nong', name: 'Uống nóng', priceAmount: 0, isActive: true },
            ],
            defaultModifierIds: ['thuong'],
            minSelected: 1,
            maxSelected: 1,
          },
        ],
      },
      {
        name: 'Nước Sấu Đá',
        description: 'Nước sấu đá giải khát',
        basePriceAmount: 12000,
        status: 'available',
        createdBy: adminId,
        updatedBy: adminId,
        modifierGroups: [
          {
            groupId: 'kich-co-ly',
            name: 'Kích cỡ ly',
            modifiers: [
              { modifierId: 'ly-lon', name: 'Ly lớn', priceAmount: 5000, isActive: true },
              { modifierId: 'ly-vua', name: 'Ly vừa', priceAmount: 0, isActive: true },
            ],
            defaultModifierIds: ['ly-vua'],
            minSelected: 1,
            maxSelected: 1,
          },
          {
            groupId: 'topping',
            name: 'Topping',
            modifiers: [
              { modifierId: 'them-sau-dam', name: 'Thêm quả sấu dầm', priceAmount: 3000, isActive: true },
            ],
            defaultModifierIds: [],
            minSelected: 0,
            maxSelected: 1,
          },
        ],
      },
    ];

    await Product.insertMany(products);
    logger.info('Example products created');
  } else {
    logger.info('Products already exist, skipping');
  }

  logger.info('Seed completed!');
  process.exit(0);
}

seed().catch((err) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});