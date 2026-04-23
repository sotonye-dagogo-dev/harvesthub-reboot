export type BannerActionVariant = "primary" | "secondary" | "outline" | "ghost";

export interface BannerActionInput {
    label?: string | null;
    href?: string | null;
    variant?: BannerActionVariant;
    openInNewTab?: boolean | null;
}

export interface ResolvedBannerAction {
    label: string;
    href: string;
    variant?: BannerActionVariant;
    openInNewTab?: boolean;
}

const DISALLOWED_BANNER_HREFS = new Set(["/operations/ads", "/admin/ads"]);

function normalizeBannerHref(href?: string | null): string | null {
    if (!href || typeof href !== "string") return null;
    const normalized = href.trim();
    if (!normalized) return null;
    if (DISALLOWED_BANNER_HREFS.has(normalized)) return null;
    return normalized;
}

export function resolveBannerActions(options: {
    actions?: BannerActionInput[] | null;
    linkUrl?: string | null;
    defaultLabel?: string;
}): ResolvedBannerAction[] {
    const explicit: ResolvedBannerAction[] = Array.isArray(options.actions)
        ? options.actions.reduce<ResolvedBannerAction[]>((acc, action) => {
            const href = normalizeBannerHref(action?.href);
            if (!href) return acc;

            const label =
                typeof action?.label === "string" && action.label.trim().length > 0
                    ? action.label.trim()
                    : "Learn more";

            const resolvedAction: ResolvedBannerAction = {
                label,
                href,
                variant: action?.variant,
                openInNewTab: Boolean(action?.openInNewTab),
            };

            acc.push(resolvedAction);
            return acc;
        }, [])
        : [];

    if (explicit.length > 0) {
        return explicit;
    }

    const fallbackHref = normalizeBannerHref(options.linkUrl);
    if (!fallbackHref) {
        return [];
    }

    return [
        {
            label: options.defaultLabel?.trim() || "Learn more",
            href: fallbackHref,
        },
    ];
}

export function resolvePrimaryBannerAction(options: {
    actions?: BannerActionInput[] | null;
    linkUrl?: string | null;
    defaultLabel?: string;
}): ResolvedBannerAction | null {
    const [primary] = resolveBannerActions(options);
    return primary ?? null;
}
