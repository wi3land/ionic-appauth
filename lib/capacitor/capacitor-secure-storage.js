import { __awaiter } from 'tslib';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
// REQUIRES CAPACITOR PLUGINS
// capacitor-secure-storage-plugin
export class CapacitorSecureStorage {
  getItem(name) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!SecureStoragePlugin) throw new Error('Capacitor Secure Storage Is Undefined!');
      const returned = yield SecureStoragePlugin.get({
        key: name,
      }).catch(() => {
        return {
          value: null,
        };
      });
      return returned.value;
    });
  }
  removeItem(name) {
    if (!SecureStoragePlugin) throw new Error('Capacitor Secure Storage Is Undefined!');
    return SecureStoragePlugin.remove({
      key: name,
    }).then(() => {});
  }
  clear() {
    if (!SecureStoragePlugin) throw new Error('Capacitor Secure Storage Is Undefined!');
    return SecureStoragePlugin.clear().then(() => {});
  }
  setItem(name, value) {
    if (!SecureStoragePlugin) throw new Error('Capacitor Secure Storage Is Undefined!');
    return SecureStoragePlugin.set({
      key: name,
      value: value,
    }).then(() => {});
  }
}
