import { __awaiter } from 'tslib';
import { Preferences } from '@capacitor/preferences';
export class CapacitorStorage {
  getItem(name) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!Preferences) throw new Error('Capacitor Preferences Is Undefined!');
      const returned = yield Preferences.get({
        key: name,
      });
      return returned.value;
    });
  }
  removeItem(name) {
    if (!Preferences) throw new Error('Capacitor Preferences Is Undefined!');
    return Preferences.remove({
      key: name,
    });
  }
  clear() {
    if (!Preferences) throw new Error('Capacitor Preferences Is Undefined!');
    return Preferences.clear();
  }
  setItem(name, value) {
    if (!Preferences) throw new Error('Capacitor Preferences Is Undefined!');
    return Preferences.set({
      key: name,
      value: value,
    });
  }
}
