import { StorageBackend } from '@openid/appauth';
import { Storage } from '@capacitor/storage';

export class CapacitorStorage implements StorageBackend {

  async getItem(name: string): Promise<string | null> {
    if(!Storage)
      throw new Error("Capacitor Storage Is Undefined!");

    let returned = await Storage.get({ key: name });
    return returned.value;
  }  
  
  removeItem(name: string): Promise<void> {
    if(!Storage)
      throw new Error("Capacitor Storage Is Undefined!");

    return Storage.remove({ key: name });
  }

  clear(): Promise<void> {
    if(!Storage)
      throw new Error("Capacitor Storage Is Undefined!");

    return Storage.clear();
  }

  setItem(name: string, value: string): Promise<void> {
    if(!Storage)
      throw new Error("Capacitor Storage Is Undefined!");
      
    return  Storage.set({ key: name, value: value });
  }
}
