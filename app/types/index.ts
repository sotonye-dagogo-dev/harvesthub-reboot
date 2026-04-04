// Common types for signup process

export type UserType = 'buyer' | 'vendor' | 'worker';
export type Stage = 'selection' | 'user-info' | 'store-info' | 'verification-docs' | 'account-info' | 'security-info';
export type StoreType = 'retail' | 'wholesale' | 'manufacturing' | 'service';

export interface UserFormData {
    userType?: UserType;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    storeName?: string;
    storeType?: StoreType;
    storeCategory?: string;
    whatsappNumber?: string;
    campus?: string;
    position?: string;
    storeDescription?: string;
    businessAddress?: string;
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    serviceCategory?: string;
    serviceLocation?: string;
    username?: string;
    bio?: string;
    profilePicture?: {
        filename: string;
        url: string;
    } | null;
    verificationDocuments?: {
        filename: string;
        url: string;
    }[];
    password?: string;
    agreement?: boolean;
    isChurchAffiliated?: boolean;
}

export interface FormComponentProps {
    onNext: () => void;
    updateFormData: (data: Partial<UserFormData>) => void;
    formData: Partial<UserFormData>;
    currentStage?: number;
}
