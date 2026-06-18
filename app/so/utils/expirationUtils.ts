// app/so/utils/expirationUtils.ts

export type ExpirationStatus =
    | "expired"      // Sudah lewat tanggal
    | "critical"     // < 7 hari
    | "warning"      // 7-30 hari
    | "caution"      // 30-90 hari
    | "safe"         // > 90 hari
    | "unknown";     // No expiration date

export interface ExpirationInfo {
    status: ExpirationStatus;
    daysRemaining: number | null;  // null kalau unknown
    label: string;
    color: {
        bg: string;
        text: string;
        border: string;
        dot: string;
    };
}

/**
 * Calculate expiration status dari date string
 * @param expirationDate - ISO date string atau null
 * @returns ExpirationInfo object dengan status dan color
 */
export const getExpirationInfo = (
    expirationDate: string | null | undefined
): ExpirationInfo => {
    // Edge case: no expiration date
    if (!expirationDate) {
        return {
            status: "unknown",
            daysRemaining: null,
            label: "No Expiry",
            color: {
                bg: "bg-slate-50",
                text: "text-slate-500",
                border: "border-slate-200",
                dot: "bg-slate-400",
            },
        };
    }

    // Calculate days remaining (UTC-based untuk consistency)
    const today = new Date();
    today.setHours(0, 0, 0, 0);  // Reset ke start of day

    const expDate = new Date(expirationDate);
    expDate.setHours(0, 0, 0, 0);

    const diffTime = expDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Determine status based on days remaining
    if (daysRemaining < 0) {
        return {
            status: "expired",
            daysRemaining: Math.abs(daysRemaining),
            label: `Expired ${Math.abs(daysRemaining)}d ago`,
            color: {
                bg: "bg-red-50",
                text: "text-red-700",
                border: "border-red-200",
                dot: "bg-red-500",
            },
        };
    }

    if (daysRemaining <= 7) {
        return {
            status: "critical",
            daysRemaining,
            label: `${daysRemaining}d left`,
            color: {
                bg: "bg-red-50",
                text: "text-red-700",
                border: "border-red-200",
                dot: "bg-red-500",
            },
        };
    }

    if (daysRemaining <= 30) {
        return {
            status: "warning",
            daysRemaining,
            label: `${daysRemaining}d left`,
            color: {
                bg: "bg-orange-50",
                text: "text-orange-700",
                border: "border-orange-200",
                dot: "bg-orange-500",
            },
        };
    }

    if (daysRemaining <= 90) {
        return {
            status: "caution",
            daysRemaining,
            label: `${daysRemaining}d left`,
            color: {
                bg: "bg-amber-50",
                text: "text-amber-700",
                border: "border-amber-200",
                dot: "bg-amber-500",
            },
        };
    }

    return {
        status: "safe",
        daysRemaining,
        label: `${daysRemaining}d left`,
        color: {
            bg: "bg-emerald-50",
            text: "text-emerald-700",
            border: "border-emerald-200",
            dot: "bg-emerald-500",
        },
    };
};

/**
 * Format expiration date untuk display
 */
export const formatExpirationDate = (dateStr: string | null): string => {
    if (!dateStr) return "—";

    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
};