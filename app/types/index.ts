// Common types for signup process

export type UserType = 'individual' | 'store';
export type Stage = 'selection' | 'user-info' | 'store-info' | 'account-info' | 'security-info';
export type StoreType = 'retail' | 'wholesale' | 'manufacturing' | 'service';

export interface UserFormData {
    userType?: UserType;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    storeName?: string;
    storeType?: StoreType;
    businessAddress?: string;
    username?: string;
    bio?: string;
    profilePicture?: {
        filename: string;
        url: string;
    } | null;
    password?: string;
    agreement?: boolean;
}

export interface FormComponentProps {
    onNext: () => void;
    updateFormData: (data: Partial<UserFormData>) => void;
    formData: Partial<UserFormData>;
    currentStage?: number;
}
