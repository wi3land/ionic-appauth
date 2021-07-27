import { StorageBackend } from "@openid/appauth";
import { Storage } from '@ionic/storage';

export class IonicStorage implements StorageBackend {
    store = new Storage();
    init: boolean = false;


    async getItem(name: string): Promise<string | null> {
        if(!this.init) {
            await this.store.create();
            this.init = true;
        }

        return await this.store.get(name);
    }  
    
    async removeItem(name: string): Promise<void> {
        if(!this.init) {
            await this.store.create();
            this.init = true;
        }
        return this.store.remove(name);
    }
  
    async clear(): Promise<void> {
        if(!this.init) {
            await this.store.create();
            this.init = true;
        }
        return this.store.clear();
    }
  
    async setItem(name: string, value: string): Promise<void> {
        if(!this.init) {
            await this.store.create();
            this.init = true;
        }
        return  this.store.set(name, value);
    }
  }