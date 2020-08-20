import { CordovaDocument } from './cordova-document';
import { StorageBackend } from '@openid/appauth';
import { SecureStorage, SecureStorageObject } from '@ionic-native/secure-storage'

// REQUIRES CORDOVA PLUGINS
// cordova-plugin-secure-storage
export class CordovaSecureStorage extends StorageBackend {

    private localData: any = {};
    private KEYSTORE: string = "SecretStore";

    public async SecureStorageExists() : Promise<boolean>{ 
        await CordovaDocument.ready();
        return SecureStorage.create(this.KEYSTORE).then(() => true, () => false);
    }

    public async hasRecord(store: SecureStorageObject, key: string){
        let keys : string[] = await store.keys();
        return (keys.indexOf(key) > -1)
     }

    public async getItem(name: string): Promise<string | null> {
        await CordovaDocument.ready();
        return SecureStorage.create(this.KEYSTORE).then((store) => {
            return store.get(name).catch(() => null);
        })
        .catch(() => {
            return this.getTemp(name);
        });
    }

    public async removeItem(name: string): Promise<void> {
        await CordovaDocument.ready();
        return SecureStorage.create(this.KEYSTORE).then((store) => {
            store.remove(name);
        })
        .catch(() => {
            this.removeTemp(name);
        });
    }

    public async setItem(name: string, value: string): Promise<void> {
        await CordovaDocument.ready();
        return SecureStorage.create(this.KEYSTORE).then((store) => {
            store.set(name,value);
        })
        .catch(() => {
            this.setTemp(name, value);
        });
    }

    public async clear(): Promise<void> {
        await CordovaDocument.ready();
        return SecureStorage.create(this.KEYSTORE).then((store) => {
            store.clear();
        })
        .catch(() => {
            this.clearTemp();
        });
    }

    private getTemp(key: string) : string | null {
        if (this.localData[key])
            return this.localData[key];
        else
            return null;   
    }

    private setTemp(key: string, data: string) : void {
        this.localData[key] = data;   
    } 

    private removeTemp(key: string) : void {
        if (this.localData[key]){
            delete this.localData[key]
        }  
    } 

    private clearTemp() : void {
        this.localData = {};
    }
}