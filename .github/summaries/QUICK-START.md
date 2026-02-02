# HarvestHub Quick Start Guide

**Date**: January 24, 2026  
**Approach**: Refactoring Martgram → HarvestHub

---

## 🎯 Immediate Next Steps

### Step 1: Rename & Update Dependencies (30 minutes)

```bash
# Navigate to Martgram directory
cd Martgram

# Rename directory (do this outside terminal if easier)
# Martgram → harvesthub-app

# Update dependencies
npm install next@^15.1.0 react@^19.0.0 react-dom@^19.0.0 antd@^5.22.0

# Install new packages
npm install zustand zod date-fns bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken prettier eslint-config-prettier

# Test build
npm run build
```

### Step 2: Find & Replace Brand Names (10 minutes)

Search for and replace across ALL files:

- "Martgram" → "HarvestHub"
- "martgram" → "harvesthub"
- "MARTGRAM" → "HARVESTHUB"

**Critical files**:

- `package.json` (name field)
- `app/layout.tsx` (metadata)
- `app/_styles/globals.css` (comments)

### Step 3: Update Theme Colors (20 minutes)

**tailwind.config.ts**:

```typescript
colors: {
  primary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',   // Light purple
    400: '#c084fc',   // Purple-400
    500: '#a855f7',   // Main purple
    600: '#9333ea',   // Primary purple
    700: '#7e22ce',   // Dark purple
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764',
  },
  // Remove old orange colors
}
darkMode: 'class',  // Add this
```

**Update globals.css**:

```css
/* Replace orange references with purple */
:root {
  --color-primary: #9333ea;
  --color-primary-light: #a855f7;
  --color-primary-dark: #7e22ce;
}

.dark {
  /* Add dark mode variables */
}
```

### Step 4: Create Core Type System (60 minutes)

**Create `lib/types.ts`**:

```typescript
// Start with enums
export enum UserRole {
  ADMIN = "ADMIN",
  VENDOR = "VENDOR",
  BUYER = "BUYER",
}

export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  // ... etc
}

// Then interfaces
export interface User {
  id: string;
  email: string;
  password: string; // hashed
  firstName: string;
  lastName: string;
  phone?: string;
  whatsappPhone?: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vendor {
  id: string;
  userId: string; // Foreign key to User
  storeName: string;
  storeSlug: string;
  // ... continue with all fields
}

// ... define all types as per REFACTORING-CHECKLIST.md
```

**Update tsconfig.json**:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "types": ["./lib/types"]
  }
}
```

### Step 5: Create Mock Data (90 minutes)

**Create `lib/data/mockData.ts`**:

```typescript
import { User, UserRole, Vendor, Product } from "@/lib/types";
import { hashSync } from "bcryptjs";

// Helper for password hashing
const hashPassword = (password: string) => hashSync(password, 10);

// Users first (no dependencies)
export const users: User[] = [
  {
    id: crypto.randomUUID(),
    email: "admin@harvesthub.com",
    password: hashPassword("Admin123!"),
    firstName: "Admin",
    lastName: "User",
    role: UserRole.ADMIN,
    phone: "+2348012345678",
    isActive: true,
    isVerified: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  // Add 5-7 vendors
  {
    id: crypto.randomUUID(),
    email: "vendor1@example.com",
    password: hashPassword("Vendor123!"),
    // ... full vendor user
  },
  // Add 10-12 buyers
  // ...
];

// Vendors second (depend on users)
export const vendors: Vendor[] = [
  {
    id: crypto.randomUUID(),
    userId: users[1].id, // Link to vendor user
    storeName: "Fresh Farm Produce",
    storeSlug: "fresh-farm-produce",
    // ... continue with realistic data
  },
  // ... 4-6 more vendors
];

// Products third (depend on vendors)
export const products: Product[] = [
  {
    id: crypto.randomUUID(),
    vendorId: vendors[0].id, // Link to vendor
    name: "Fresh Tomatoes (1kg)",
    slug: "fresh-tomatoes-1kg",
    description: "Farm fresh tomatoes, locally sourced",
    category: ProductCategory.FARM_PRODUCE,
    price: 1500,
    stock: 50,
    mainImage: "https://via.placeholder.com/400",
    images: ["https://via.placeholder.com/400"],
    isActive: true,
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // ... 30-50 more products
];

// Continue with wallets, carts, orders, etc.
```

**Key Principles**:

- ✅ All IDs are UUIDs
- ✅ All foreign keys point to existing records
- ✅ Passwords are bcrypt hashed
- ✅ Realistic Nigerian data (+234 phones, Lagos locations)
- ✅ Include edge cases (empty carts, low stock, etc.)

### Step 6: Create Database Service (60 minutes)

**Create `lib/data/database.ts`**:

```typescript
import { users, vendors, products } from "./mockData";
import { User, Vendor, Product } from "@/lib/types";

// Deep clone helper
const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data));

export const db = {
  users: {
    findById: (id: string): User | null => {
      const user = users.find((u) => u.id === id);
      return user ? clone(user) : null;
    },

    findByEmail: (email: string): User | null => {
      const user = users.find((u) => u.email === email);
      return user ? clone(user) : null;
    },

    findAll: (): User[] => {
      return clone(users);
    },

    // ... more user methods
  },

  vendors: {
    findById: (id: string): Vendor | null => {
      const vendor = vendors.find((v) => v.id === id);
      return vendor ? clone(vendor) : null;
    },

    findByUserId: (userId: string): Vendor | null => {
      const vendor = vendors.find((v) => v.userId === userId);
      return vendor ? clone(vendor) : null;
    },

    // ... more vendor methods
  },

  products: {
    findById: (id: string): Product | null => {
      const product = products.find((p) => p.id === id);
      return product ? clone(product) : null;
    },

    findAll: (filters?: {
      category?: string;
      vendorId?: string;
    }): Product[] => {
      let results = [...products];

      if (filters?.category) {
        results = results.filter((p) => p.category === filters.category);
      }

      if (filters?.vendorId) {
        results = results.filter((p) => p.vendorId === filters.vendorId);
      }

      return clone(results);
    },

    // ... more product methods
  },

  // ... cart, orders, wallet, etc.
};
```

**Critical**: Always deep clone data before returning to prevent mutations!

---

## 📋 Development Workflow

### Daily Workflow

1. **Check** [REFACTORING-CHECKLIST.md](REFACTORING-CHECKLIST.md) for current tasks
2. **Mark** tasks as complete with `[x]` when done
3. **Test** each change immediately (no batch testing)
4. **Commit** frequently with descriptive messages
5. **Handle** empty states for every new feature

### Testing Checklist (Run After Each Change)

```bash
# Type checking
npm run build

# Dev server
npm run dev

# Manual tests
# 1. Navigate to the changed page
# 2. Test with empty data
# 3. Test with full data
# 4. Test error states
# 5. Check console for errors
```

### When Stuck

1. Check [copilot-instructions.md](.github/copilot-instructions.md) for patterns
2. Check [project-context.md](.github/project-context.md) for architecture
3. Check [REFACTORING-CHECKLIST.md](.github/REFACTORING-CHECKLIST.md) for details
4. Review sample code in Martgram directory
5. Ask for help with specific error messages

---

## 🚀 Key Success Factors

### 1. **Type Safety**

- Zero `any` types
- All interfaces defined in `lib/types.ts`
- Strict TypeScript configuration

### 2. **Relational Integrity**

- All foreign keys must exist
- Use helper functions to validate relations
- Deep clone data to prevent mutations

### 3. **Empty State Handling**

```typescript
// ALWAYS do this:
const products = await db.products.findAll();

if (!products || products.length === 0) {
  return <EmptyProductsState />;
}

// NOT this:
return products.map(product => ...); // Can crash if null!
```

### 4. **Defensive Coding**

```typescript
// Use optional chaining
const vendorName = vendor?.storeName ?? "Unknown";

// Check before accessing
if (user && user.role === UserRole.ADMIN) {
  // Safe to use user
}

// Provide defaults
const balance = wallet?.balance ?? 0;
```

### 5. **Incremental Progress**

- Complete one phase before moving to next
- Test thoroughly before proceeding
- Mark checklist items as you go
- Commit working code frequently

---

## 🎨 Purple Theme Quick Reference

```typescript
// Primary purple: #9333ea (purple-600)
// Light purple: #a855f7 (purple-500)
// Dark purple: #7e22ce (purple-700)

// Tailwind classes:
<button className="bg-purple-600 hover:bg-purple-700 text-white">
  Click Me
</button>

<div className="text-purple-600 dark:text-purple-400">
  Purple text
</div>

// Ant Design theme:
const theme = {
  token: {
    colorPrimary: '#9333ea',
  },
  algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
};
```

---

## 📞 Nigerian Market Specifics

### Phone Numbers

```typescript
// Always auto-prefix +234
<Input addonBefore="+234" placeholder="8012345678" />

// Validation
const phoneSchema = z.string()
  .regex(/^[0-9]{10}$/, "Phone number must be 10 digits");
```

### Campus Locations

```typescript
export const CAMPUS_LOCATIONS = [
  { value: "OREGUN_HQ", label: "Oregun (Headquarters)" },
  { value: "LEKKI", label: "Lekki" },
  { value: "VICTORIA_ISLAND", label: "Victoria Island" },
  { value: "IKEJA", label: "Ikeja" },
  { value: "FESTAC", label: "Festac" },
  { value: "AJAH", label: "Ajah" },
  { value: "OUTSIDE_LAGOS", label: "Outside Lagos" },
];
```

### Pickup Services

```typescript
export const PICKUP_SERVICES = [
  {
    value: "SUNDAY_FIRST",
    label: "Sunday Service (First)",
    time: "7:00 AM - 9:30 AM",
  },
  {
    value: "SUNDAY_SECOND",
    label: "Sunday Service (Second)",
    time: "9:30 AM - 12:00 PM",
  },
  {
    value: "MIDWEEK",
    label: "Midweek Service",
    time: "Wednesday 6:00 PM - 8:00 PM",
  },
];
```

---

## 🔗 Essential Links

- **Main Plan**: [plan.md](.github/plan.md)
- **Detailed Checklist**: [REFACTORING-CHECKLIST.md](.github/REFACTORING-CHECKLIST.md)
- **Coding Guidelines**: [copilot-instructions.md](.github/copilot-instructions.md)
- **Architecture**: [project-context.md](.github/project-context.md)
- **Bug Reference**: [sample-context/MY HARVEST HUB PLATFORM BUG.md](sample-context/MY%20HARVEST%20HUB%20PLATFORM%20BUG%20.md)

---

**Ready to Start!** Begin with Step 1 above and follow the REFACTORING-CHECKLIST.md sequentially.
