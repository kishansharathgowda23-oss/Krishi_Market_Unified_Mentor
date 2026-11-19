# Krishi Market — Farmer-to-Consumer Agri Marketplace

Krishi Market directly connects local Indian farmers with households across Karnataka (Bengaluru, Mysuru, Mandya, Ramanagara, and Kolar) with transparent INR pricing, harvest date traceability, role-based dashboards, and direct order fulfillment.

## Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend**: Node.js, Express.js REST API (`server.ts`, `server/routes/api.ts`)
- **Database**: MongoDB via Mongoose (`server/models/mongooseModels.ts`) with automatic persistent JSON store fallback (`.data/krishi_store.json`) when `MONGODB_URI` is not configured
- **Auth**: JWT (`jsonwebtoken`) + `bcryptjs` role-based access control (`farmer`, `customer`, `admin`)
- **Media**: Cloudinary SDK integration (`server/utils/cloudinary.ts`)

## Setup & Run Commands
```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional — runs out of the box with local fallback)
cp .env.example .env

# 3. Start full-stack dev server (Express + Vite on port 3000)
npm run dev

# 4. Type-check and build for production
npm run lint
npm run build
npm start
```

## Demo Credentials (Password: `Krishi@123`)
- **Customer**: `ananya@krishimarket.in`
- **Farmer**: `ramesh@krishimarket.in`
- **Admin**: `admin@krishimarket.in`
