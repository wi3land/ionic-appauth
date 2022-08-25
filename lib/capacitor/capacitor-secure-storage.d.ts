import { StorageBackend } from '@openid/appauth';
export declare class CapacitorSecureStorage implements StorageBackend {
    getItem(name: string): Promise<string | null>;
    removeItem(name: string): Promise<void>;
    clear(): Promise<void>;
    setItem(name: string, value: string): Promise<void>;
}
