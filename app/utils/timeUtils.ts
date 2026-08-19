// app/utils/timeUtils.ts
export const getRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours === 0) {
            const diffMins = Math.floor(diffTime / (1000 * 60));
            return diffMins <= 1 ? "Just now" : `${diffMins}m ago`;
        }
        return `${diffHours}h ago`;
    }
    return diffDays === 1 ? "Yesterday" : `${diffDays} days ago`;
};