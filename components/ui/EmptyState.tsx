import { ReactNode } from "react";
import { Package, ShoppingCart, Search, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?:
    | {
        label: string;
        onClick: () => void;
      }
    | ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      {icon && <div className="mb-4 text-gray-400 dark:text-gray-600">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-gray-600 dark:text-gray-400">{description}</p>
      )}
      {action && (
        <>
          {typeof action === "object" && "label" in action ? (
            <Button onClick={action.onClick} className="mt-6">
              {action.label}
            </Button>
          ) : (
            <div className="mt-6">{action}</div>
          )}
        </>
      )}
    </div>
  );
}

// Predefined empty states for common scenarios

export function EmptyProducts({ onAddProduct }: { onAddProduct?: () => void }) {
  return (
    <EmptyState
      icon={<Package className="h-16 w-16" />}
      title="No products found"
      description="Get started by adding your first product to your store."
      action={
        onAddProduct
          ? {
              label: "Add Product",
              onClick: onAddProduct,
            }
          : undefined
      }
    />
  );
}

export function EmptyCart({ onBrowseProducts }: { onBrowseProducts?: () => void }) {
  return (
    <EmptyState
      icon={<ShoppingCart className="h-16 w-16" />}
      title="Your cart is empty"
      description="Start shopping to add items to your cart."
      action={
        onBrowseProducts
          ? {
              label: "Browse Products",
              onClick: onBrowseProducts,
            }
          : undefined
      }
    />
  );
}

export function EmptySearchResults() {
  return (
    <EmptyState
      icon={<Search className="h-16 w-16" />}
      title="No results found"
      description="Try adjusting your search or filters to find what you're looking for."
    />
  );
}

export function EmptyOrders() {
  return (
    <EmptyState
      icon={<Inbox className="h-16 w-16" />}
      title="No orders yet"
      description="Your order history will appear here once you make a purchase."
    />
  );
}
