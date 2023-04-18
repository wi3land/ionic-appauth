import { StorageBackend } from '@openid/appauth';
import { Storage } from '@ionic/storage';
export declare class IonicStorage implements StorageBackend {
  store: Storage;
  init: boolean;
  getItem(name: string): Promise<string | null>;
  removeItem(name: string): Promise<void>;
  clear(): Promise<void>;
  setItem(name: string, value: string): Promise<void>;
}
