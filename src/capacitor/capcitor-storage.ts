import { StorageBackend } from '@openid/appauth';
import { Plugins } from '@capacitor/core';

export class CapacitorStorage implements StorageBackend {

  async getItem(name: string): Promise<string> {
    if(!Plugins.Storage)
      throw new Error("Capacitor Storage Is Undefined!");

    let returned = await Plugins.Storage.get({ key: name });
    return (returned.value == null) ? "" : returned.value;
  }  
  
  removeItem(name: string): Promise<void> {
    if(!Plugins.Storage)
      throw new Error("Capacitor Storage Is Undefined!");

    return Plugins.Storage.remove({ key: name });
  }

  clear(): Promise<void> {
    if(!Plugins.Storage)
      throw new Error("Capacitor Storage Is Undefined!");

    return Plugins.Storage.clear();
  }

  setItem(name: string, value: string): Promise<void> {
    if(!Plugins.Storage)
      throw new Error("Capacitor Storage Is Undefined!");
      
    return  Plugins.Storage.set({ key: name, value: value });
  }
}
