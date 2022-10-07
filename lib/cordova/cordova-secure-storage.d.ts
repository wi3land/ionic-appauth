import { StorageBackend } from '@openid/appauth';
import { SecureStorageObject } from '@awesome-cordova-plugins/secure-storage';
export declare class CordovaSecureStorage extends StorageBackend {
    private localData;
    private KEYSTORE;
    SecureStorageExists(): Promise<boolean>;
    hasRecord(store: SecureStorageObject, key: string): Promise<boolean>;
    getItem(name: string): Promise<string | null>;
    removeItem(name: string): Promise<void>;
    setItem(name: string, value: string): Promise<void>;
    clear(): Promise<void>;
    private getTemp;
    private setTemp;
    private removeTemp;
    private clearTemp;
}
