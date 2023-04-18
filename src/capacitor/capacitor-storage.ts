import { StorageBackend } from '@openid/appauth';
import { Preferences } from '@capacitor/preferences';

export class CapacitorStorage implements StorageBackend {
  async getItem(name: string): Promise<string | null> {
    if (!Preferences) throw new Error('Capacitor Preferences Is Undefined!');

    const returned = await Preferences.get({
      key: name,
    });
    return returned.value;
  }

  removeItem(name: string): Promise<void> {
    if (!Preferences) throw new Error('Capacitor Preferences Is Undefined!');

    return Preferences.remove({
      key: name,
    });
  }

  clear(): Promise<void> {
    if (!Preferences) throw new Error('Capacitor Preferences Is Undefined!');

    return Preferences.clear();
  }

  setItem(name: string, value: string): Promise<void> {
    if (!Preferences) throw new Error('Capacitor Preferences Is Undefined!');

    return Preferences.set({
      key: name,
      value: value,
    });
  }
}
