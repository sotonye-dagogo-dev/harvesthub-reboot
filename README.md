# HarvestHub E-Commerce Platform

> A comprehensive e-commerce marketplace connecting buyers and vendors with integrated wallet functionality, promotional banners, and flexible pickup/delivery options.

## 🎯 Project Overview

HarvestHub is a modern e-commerce platform designed specifically for the Nigerian market, with a focus on Lagos-based vendors and church community integration. The platform provides a trusted ecosystem where vendors can establish digital storefronts, manage products, and fulfill orders, while buyers enjoy a seamless shopping experience.

### Key Features

- **Three-Tier Role System**: Admin, Vendor, and Buyer roles with distinct capabilities
- **Integrated Wallet System**: Deposits, payments, withdrawals, and transaction tracking
- **Promotional Banners**: Auto-rotating carousel for vendor and product promotions
- **Flexible Delivery Options**: Church pickup services and home delivery
- **Product Reviews & Ratings**: Community-driven product feedback
- **Vendor Storefronts**: Customizable stores with analytics and order management
- **Nigerian Market Focus**: Lagos campus locations, +234 phone prefix, church pickup services

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

```bash
# Install dependencies
npm install

# Create environment variables file
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run clean    # Clean Next.js cache
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript (strict mode)
- **UI**: Ant Design 5.x + Tailwind CSS 3.x
- **State**: React Context + Zustand
- **Validation**: Zod
- **Authentication**: JWT with httpOnly cookies
- **Database (Future)**: PostgreSQL + Prisma ORM
- **Payment (Future)**: Paystack, Flutterwave

## 📁 Project Structure

```
harvesthub-app/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (buyer)/         # Buyer-facing pages
│   ├── (vendor)/        # Vendor dashboard
│   ├── (admin)/         # Admin panel
│   ├── api/             # API routes
│   ├── components/      # React components
│   └── lib/             # Utilities, types, data
├── public/              # Static assets
└── .github/             # Documentation
```

## 🎨 Theme

HarvestHub uses a neon purple color scheme:

- **Primary**: #9333ea (purple-600)
- **Light**: #a855f7 (purple-500)
- **Dark**: #7e22ce (purple-700)

The platform supports both light and dark modes.

## 📚 Documentation

Comprehensive documentation is available in the `.github` directory:

- [Copilot Instructions](.github/copilot-instructions.md) - AI coding guidelines
- [Development Plan](.github/plan.md) - 20-phase roadmap
- [Project Context](.github/project-context.md) - Technical architecture
- [Quick Start Guide](.github/QUICK-START.md) - Immediate action guide
- [Ready to Start](.github/READY-TO-START.md) - Getting started checklist

## 🇳🇬 Nigerian Market Features

### Lagos Campus Locations

- Oregun (Headquarters)
- Lekki
- Victoria Island
- Ikeja
- Festac
- Ajah
- Outside Lagos (Other States)

### Pickup Services

- Sunday Service (First): 7:00 AM - 9:30 AM
- Sunday Service (Second): 9:30 AM - 12:00 PM
- Midweek Service: Wednesday 6:00 PM - 8:00 PM
- Special Events

### Currency

- Nigerian Naira (₦, NGN)
- Format: ₦1,234.56

## 🔐 Security

- Strict TypeScript configuration (zero `any` types)
- JWT authentication with httpOnly cookies
- Password hashing with bcryptjs
- Input validation with Zod schemas
- Role-based access control
- XSS and CSRF protection

## 🧪 Development Approach

This project follows a refactoring-first approach, transforming an existing codebase (Martgram) into HarvestHub. Key principles:

- **Type Safety First**: Comprehensive TypeScript types defined globally
- **Relational Integrity**: Mock data with valid foreign keys from day one
- **Empty State Handling**: Defensive coding to prevent null/undefined bugs
- **Incremental Refactoring**: Transform one feature at a time
- **Test After Each Change**: Ensure stability throughout development

## 📝 License

Private - All rights reserved.

## 👥 Team

MyHarvestHub Team

---

**Current Phase**: Phase 1 - Foundation Refactoring  
**Status**: In Development  
**Last Updated**: January 2026
