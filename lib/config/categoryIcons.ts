import type { LucideIcon } from "lucide-react";
import {
  Baby,
  Bike,
  Briefcase,
  Car,
  CookingPot,
  Gamepad2,
  HardHat,
  Lamp,
  Laptop,
  LayoutGrid,
  Refrigerator,
  ShieldCheck,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sofa,
  Sparkles,
  Tractor,
  Wrench,
} from "lucide-react";

/**
 * Category → icon map for Jumia-style category menus and tiles.
 * Keyed by the VendorCategory enum value. Unknown categories fall back to a grid icon.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  ELECTRONICS: Smartphone,
  COMPUTERS_OFFICE: Laptop,
  HOME_APPLIANCES: Refrigerator,
  FURNITURE: Sofa,
  HOME_DECOR: Lamp,
  KITCHEN_DINING: CookingPot,
  FASHION: Shirt,
  BEAUTY: Sparkles,
  BABY_KIDS: Baby,
  TOYS_GAMES: Gamepad2,
  AUTOMOTIVE: Car,
  MOTORCYCLES: Bike,
  SPARE_PARTS: Wrench,
  INDUSTRIAL: HardHat,
  AGRICULTURE: Tractor,
  SECURITY: ShieldCheck,
  GROCERY_FOOD: ShoppingBasket,
  SERVICES: Briefcase,
  OTHERS: LayoutGrid,
};

export function getCategoryIcon(categoryValue: string): LucideIcon {
  return CATEGORY_ICONS[categoryValue] ?? LayoutGrid;
}
