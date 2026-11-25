// Common types for signup process

export type UserType = 'buyer' | 'vendor';
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
        documentType?: 'ID' | 'BUSINESS_REGISTRATION' | 'UTILITY_BILL';
        filename: string;
        url: string;
        publicId?: string;
    }[];
    idType?: string;
    /** INDIVIDUAL = individual/small seller (CAC optional); BUSINESS = registered business (CAC required) */
    sellerType?: 'INDIVIDUAL' | 'BUSINESS';
    /** Church department or unit the vendor serves in (checked by Support) */
    department?: string;
    /** Someone who can vouch for the vendor */
    refereeName?: string;
    refereePhone?: string;
    /** Paid package picked at signup; vendors start free and pay for it when their free listings run out */
    chosenPackageId?: string;
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
