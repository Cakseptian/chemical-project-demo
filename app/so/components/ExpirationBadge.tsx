// app/so/components/ExpirationBadge.tsx
"use client";

import { getExpirationInfo, formatExpirationDate } from "../utils/expirationUtils";

interface ExpirationBadgeProps {
    expirationDate: string | null | undefined;
    showDate?: boolean;      // default: true
    compact?: boolean;       // default: false (untuk tight spaces)
}

export const ExpirationBadge = ({
    expirationDate,
    showDate = true,
    compact = false
}: ExpirationBadgeProps) => {
    const info = getExpirationInfo(expirationDate);

    // Compact mode: just colored dot + days
    if (compact) {
        return (
            <div className="flex items-center gap-1.5">
                <span
                    className={`w-1.5 h-1.5 rounded-full ${info.color.dot}`}
                    title={info.label}
                />
                <span className={`text-xs font-mono tabular-nums ${info.color.text}`}>
                    {info.status === "unknown"
                        ? "—"
                        : info.status === "expired"
                            ? `-${info.daysRemaining}d`
                            : `${info.daysRemaining}d`
                    }
                </span>
            </div>
        );
    }

    // Full mode: badge with icon + label + date
    return (
        <div className="flex flex-col gap-0.5">
            <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold w-fit ${info.color.bg} ${info.color.text} ${info.color.border}`}
            >
                <span className={`w-1.5 h-1.5 rounded-full ${info.color.dot}`} />
                <span className="tabular-nums">{info.label}</span>
            </span>

            {showDate && expirationDate && (
                <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                    {formatExpirationDate(expirationDate)}
                </span>
            )}
        </div>
    );
};