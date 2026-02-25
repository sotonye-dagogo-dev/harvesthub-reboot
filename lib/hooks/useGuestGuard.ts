import { useAuth } from "@/lib/contexts/AuthContext";
import { Modal } from "antd";
import { useRouter } from "next/navigation";

/**
 * Returns a guard function that checks if the user is authenticated.
 * If not, shows a modal prompting login/signup and returns `false`.
 * If authenticated, returns `true` so the caller can proceed.
 */
export function useGuestGuard() {
    const { user } = useAuth();
    const router = useRouter();

    const requireAuth = (actionLabel = "do this"): boolean => {
        if (user) return true;

        Modal.confirm({
            title: "Sign in required",
            content: `You need to be logged in to ${actionLabel}. Would you like to sign in or create an account?`,
            okText: "Log in",
            cancelText: "Sign up",
            onOk: () => router.push("/login"),
            onCancel: () => router.push("/signup"),
            closable: true,
            maskClosable: true,
        });

        return false;
    };

    return { requireAuth, isGuest: !user };
}
