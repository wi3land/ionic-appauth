import { StorageBackend } from '@openid/appauth';
import 'capacitor-secure-storage-plugin';
import { Plugins } from '@capacitor/core';

const { SecureStoragePlugin } = Plugins;

export class CapacitorSecureStorage implements StorageBackend {

  async getItem(name: string): Promise<string> {
    if(!SecureStoragePlugin)
      throw new Error("Capacitor Secure Storage Is Undefined!");

    let returned = await SecureStoragePlugin.get({ key: name });
    return returned.value;
  }  
  
  removeItem(name: string): Promise<void> {
    if(!SecureStoragePlugin)
      throw new Error("Capacitor Secure Storage Is Undefined!");

    return SecureStoragePlugin.remove({ key: name }).then(() => {});
  }

  clear(): Promise<void> {
    if(!SecureStoragePlugin)
      throw new Error("Capacitor Secure Storage Is Undefined!");

    return SecureStoragePlugin.clear().then(() => {});
  }

  setItem(name: string, value: string): Promise<void> {
    if(!SecureStoragePlugin)
      throw new Error("Capacitor Secure Storage Is Undefined!");
      
    return  SecureStoragePlugin.set({ key: name, value: value }).then(() => {});
  }
}
