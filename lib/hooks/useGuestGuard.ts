import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/contexts/ToastContext";
import React from "react";

/**
 * Returns a guard function that checks if the user is authenticated.
 * If not, shows a notification prompting login/signup and returns `false`.
 * If authenticated, returns `true` so the caller can proceed.
 */
export function useGuestGuard() {
    const { user } = useAuth();
    const router = useRouter();
    const toast = useToast();

    const requireAuth = (actionLabel = "do this"): boolean => {
        if (user) return true;

        const btn = React.createElement(
            'div',
            { className: 'flex items-center gap-2' },
            React.createElement(
                'button',
                {
                    className: 'rounded-ds-md border border-ds-border-base px-3 py-1 text-sm font-medium',
                    onClick: () => router.push('/login'),
                },
                'Log in'
            ),
            React.createElement(
                'button',
                {
                    className: 'rounded-ds-md bg-ds-brand-primary px-3 py-1 text-sm font-medium text-white',
                    onClick: () => router.push('/signup'),
                },
                'Sign up'
            )
        );

        toast.notify({
            type: 'info',
            message: `Sign in required`,
            description: `You need to be logged in to ${actionLabel}.`,
            duration: 6,
            btn,
        } as any);

        return false;
    };

    return { requireAuth, isGuest: !user };
}
