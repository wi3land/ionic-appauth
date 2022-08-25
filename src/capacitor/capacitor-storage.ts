import { StorageBackend } from '@openid/appauth';
import { Preferences } from '@capacitor/preferences';

export class CapacitorStorage implements StorageBackend {

  async getItem(name: string): Promise<string | null> {
    if(!Storage)
      throw new Error("Capacitor Storage Is Undefined!");

    const returned = await Preferences.get({ key: name });
    return returned.value;
  }

  removeItem(name: string): Promise<void> {
    if(!Storage)
      throw new Error("Capacitor Storage Is Undefined!");

    return Preferences.remove({ key: name });
  }

  clear(): Promise<void> {
    if(!Storage)
      throw new Error("Capacitor Storage Is Undefined!");

    return Preferences.clear();
  }

  setItem(name: string, value: string): Promise<void> {
    if(!Storage)
      throw new Error("Capacitor Storage Is Undefined!");

    return  Preferences.set({ key: name, value: value });
  }
}
