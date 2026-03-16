import type * as T from './types';

// Expose commonly used types and interfaces from `lib/types.ts` as globals
// so they can be used across the project without explicit imports.
declare global {
    type ID = T.ID;
    type Timestamp = T.Timestamp;
    type Email = T.Email;
    type PhoneNumber = T.PhoneNumber;
    type URL = T.URL;

    type User = T.User;
    type Buyer = T.Buyer;
    type BuyerPreferences = T.BuyerPreferences;

    type Vendor = T.Vendor;
    type BusinessVerification = T.BusinessVerification;
    type VendorStoreSettings = T.VendorStoreSettings;
    type VendorAnalytics = T.VendorAnalytics;

    type Product = T.Product;
    type ProductVariant = T.ProductVariant;

    type Cart = T.Cart;
    type CartItem = T.CartItem;

    type Order = T.Order;
    type OrderItem = T.OrderItem;
    type PickupDetails = T.PickupDetails;
    type OrderStatusHistory = T.OrderStatusHistory;

    type Address = T.Address;

    type Wallet = T.Wallet;
    type Transaction = T.Transaction;

    type Review = T.Review;

    type BannerAction = T.BannerAction;
    type BannerTheme = T.BannerTheme;
    type Banner = T.Banner;

    type Notification = T.Notification;
    type NotificationType = T.NotificationType;

    type LoginFormData = T.LoginFormData;
    type RegisterFormData = T.RegisterFormData;
    type UserFormData = T.UserFormData;

    type ProductFormData = T.ProductFormData;
    type OrderFormData = T.OrderFormData;
    type ReviewFormData = T.ReviewFormData;
    type AddressFormData = T.AddressFormData;
    type WalletDepositFormData = T.WalletDepositFormData;
    type WalletWithdrawalFormData = T.WalletWithdrawalFormData;
    type VendorStoreFormData = T.VendorStoreFormData;

    type ServiceDetails = T.ServiceDetails;
    type WeeklySlot = T.WeeklySlot;
    type Booking = T.Booking;
    type BookingFormData = T.BookingFormData;
    type ServiceFormData = T.ServiceFormData;

    type PlatformCommissionTier = T.PlatformCommissionTier;
    type PlatformSettings = T.PlatformSettings;

    type VendorContentType = T.VendorContentType;
    type VendorContentStatus = T.VendorContentStatus;
    type VendorContent = T.VendorContent;
    type VendorContentFormData = T.VendorContentFormData;

    type ApiResponse<T = unknown> = T.ApiResponse<T>;
    type PaginatedResponse<T = unknown> = T.PaginatedResponse<T>;
    type ApiError = T.ApiError;

    type AuthTokens = T.AuthTokens;
    type AuthUser = T.AuthUser;
    type JWTPayload = T.JWTPayload;

    type ProductFilters = T.ProductFilters;
    type OrderFilters = T.OrderFilters;
    type VendorFilters = T.VendorFilters;
    type SortOrder = T.SortOrder;
    type SortOptions = T.SortOptions;
    type PaginationOptions = T.PaginationOptions;

    type SalesAnalytics = T.SalesAnalytics;
    type VendorPerformance = T.VendorPerformance;
    type PlatformAnalytics = T.PlatformAnalytics;

    type AvailabilityRequestStatus = T.AvailabilityRequestStatus;
    type AvailabilityRequestItem = T.AvailabilityRequestItem;
    type AvailabilityRequest = T.AvailabilityRequest;

    type AdStatus = T.AdStatus;
    type Ad = T.Ad;

    type MilestoneType = T.MilestoneType;
    type MilestoneRecord = T.MilestoneRecord;

    type VoucherTypeValue = T.VoucherTypeValue;
    type Voucher = T.Voucher;
    type VoucherRedemption = T.VoucherRedemption;

    type ProofOfTransferStatusValue = T.ProofOfTransferStatusValue;
    type ProofOfTransfer = T.ProofOfTransfer;

    type PushSubscriptionRecord = T.PushSubscriptionRecord;
    type NotificationPreference = T.NotificationPreference;

    type AdvertiserPayment = T.AdvertiserPayment;

    type BugReport = T.BugReport;
    type BugReportFormData = T.BugReportFormData;
}

export { };
