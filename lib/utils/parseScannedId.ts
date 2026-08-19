/**
 * parseScannedId — extract UUID from a scanned QR string.
 *
 * QR labels encode the unit UUID as a URL query param:
 *   https://domain.com?scan=<UUID>
 *
 * This function handles three input formats:
 *   1. Full URL  — "https://domain.com?scan=UUID"
 *   2. Partial   — "path?scan=UUID"
 *   3. Raw UUID  — "UUID" (passed through as-is)
 *
 * Returns a sanitized UUID string (alphanumeric + hyphens only).
 */
export function parseScannedId(decodedText: string): string {
    let finalId = decodedText;

    try {
        if (decodedText.startsWith("http")) {
            const urlObj = new URL(decodedText);
            finalId = urlObj.searchParams.get("scan") || decodedText;
        } else if (decodedText.includes("?scan=")) {
            finalId = decodedText.split("?scan=")[1];
        }
    } catch {
        if (decodedText.includes("?scan=")) {
            finalId = decodedText.split("?scan=")[1];
        }
    }

    // Sanitize — strip non UUID-safe chars
    return decodeURIComponent(finalId).replace(/[^a-zA-Z0-9-]/g, "");
}
