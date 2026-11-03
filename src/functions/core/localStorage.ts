import { LocalStorageDefaults } from "./localStorage.d";

export const localStorageDefaults: LocalStorageDefaults = {
    "settings:modalAnimation": true,
    "sound:volume:SOUND": 0,
    "sound:volume:MUSIC": 0,
    "sound:muted:SOUND": false,
    "sound:muted:MUSIC": false
};

const parseValue = <T>(raw: string | null, fallback?: T) => {
    if (raw === null) return fallback ?? null;

    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback ?? (raw as unknown as T);
    }
};

function get<K extends keyof LocalStorageDefaults>(key: K): LocalStorageDefaults[K];
function get<T>(key: string, fallback?: T): T | null;
function get(key: string, fallback?: unknown) {
    const defaultValue = fallback ?? localStorageDefaults[key as keyof LocalStorageDefaults];

    try {
        return parseValue(window.localStorage.getItem(key), defaultValue);
    } catch {
        return defaultValue ?? null;
    }
}

export const localStorage = {
    get,
    set: <T>(key: string, value: T) => {
        window.localStorage.setItem(key, JSON.stringify(value));
    },
    remove: (key: string) => {
        window.localStorage.removeItem(key);
    }
};
