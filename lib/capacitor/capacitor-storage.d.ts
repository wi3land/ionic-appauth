import { StorageBackend } from '@openid/appauth';
export declare class CapacitorStorage implements StorageBackend {
    getItem(name: string): Promise<string | null>;
    removeItem(name: string): Promise<void>;
    clear(): Promise<void>;
    setItem(name: string, value: string): Promise<void>;
}
