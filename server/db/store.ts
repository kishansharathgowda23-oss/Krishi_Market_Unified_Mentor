import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { createSeedDataset, type SeedDataset } from './seedData.ts';
import {
  AddressModel,
  CategoryModel,
  ComplaintModel,
  CustomerModel,
  FarmerModel,
  NotificationModel,
  OrderModel,
  PlatformSettingsModel,
  ProductModel,
  ReviewModel,
  UserModel,
} from '../models/mongooseModels.ts';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_FILE = path.join(DATA_DIR, 'krishi_store.json');

let useMongo = false;
let memoryStore: SeedDataset | null = null;

function ensureLocalStore(): SeedDataset {
  if (memoryStore) {
    return memoryStore;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(STORE_FILE)) {
    try {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      memoryStore = JSON.parse(raw) as SeedDataset;
      return memoryStore;
    } catch {
      // fall through to fresh seed
    }
  }

  memoryStore = createSeedDataset();
  persistLocalStore();
  return memoryStore;
}

export function persistLocalStore(): void {
  if (!memoryStore || useMongo) return;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
}

function serializeDoc<T>(doc: unknown): T {
  const obj = typeof (doc as { toObject?: () => unknown }).toObject === 'function'
    ? (doc as { toObject: () => Record<string, unknown> }).toObject()
    : (doc as Record<string, unknown>);
  if (obj && obj._id !== undefined) {
    return { ...obj, _id: String(obj._id) } as T;
  }
  return obj as T;
}

export async function initializeDatabase(): Promise<{ mode: 'mongodb' | 'local' }> {
  const uri = process.env.MONGODB_URI;
  if (uri && !uri.includes('<username>')) {
    try {
      await mongoose.connect(uri);
      useMongo = true;

      const userCount = await UserModel.countDocuments();
      if (userCount === 0) {
        const seed = createSeedDataset();
        await UserModel.insertMany(seed.users.map(({ _id, ...rest }) => rest));
        const allUsers = await UserModel.find().lean();
        const userMap = new Map<string, string>();
        for (const seedUser of seed.users) {
          const matched = allUsers.find((u) => u.email === seedUser.email);
          if (matched) userMap.set(seedUser._id, String(matched._id));
        }

        await CategoryModel.insertMany(seed.categories.map(({ _id, ...rest }) => rest));
        await FarmerModel.insertMany(
          seed.farmers.map(({ _id, userId, ...rest }) => ({
            ...rest,
            userId: userMap.get(userId) || userId,
          }))
        );
        await CustomerModel.insertMany(
          seed.customers.map(({ _id, userId, ...rest }) => ({
            ...rest,
            userId: userMap.get(userId) || userId,
          }))
        );
        await ProductModel.insertMany(seed.products.map(({ _id, ...rest }) => rest));
        await OrderModel.insertMany(seed.orders.map(({ _id, ...rest }) => rest));
        await ReviewModel.insertMany(seed.reviews.map(({ _id, ...rest }) => rest));
        await AddressModel.insertMany(seed.addresses.map(({ _id, ...rest }) => rest));
        await NotificationModel.insertMany(seed.notifications.map(({ _id, ...rest }) => rest));
        await ComplaintModel.insertMany(seed.complaints.map(({ _id, ...rest }) => rest));
        await PlatformSettingsModel.create(seed.settings);
      }

      return { mode: 'mongodb' };
    } catch (err) {
      console.warn('MongoDB connection failed, falling back to local JSON store:', err);
      useMongo = false;
    }
  }

  ensureLocalStore();
  return { mode: 'local' };
}

export function isMongoMode(): boolean {
  return useMongo;
}

export function getLocalStore(): SeedDataset {
  return ensureLocalStore();
}

export function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export const db = {
  serializeDoc,
};
