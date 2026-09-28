/*
 * Local identity translation shim for standalone Equicord userplugins.
 * No network access, vendor runtime or synchronization is performed here.
 */

export const t = (key: string): string => key;
export const tPlugin = t;

export function useTranslation() {
    return { t, lang: "en" as const };
}
