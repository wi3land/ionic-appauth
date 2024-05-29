import { __awaiter } from 'tslib';
import { CordovaDocument } from './cordova-document';
import { StorageBackend } from '@openid/appauth';
import { SecureStorage } from '@awesome-cordova-plugins/secure-storage';
// REQUIRES CORDOVA PLUGINS
// cordova-plugin-secure-storage
export class CordovaSecureStorage extends StorageBackend {
  constructor() {
    super(...arguments);
    this.localData = {};
    this.KEYSTORE = 'SecretStore';
  }
  SecureStorageExists() {
    return __awaiter(this, void 0, void 0, function* () {
      yield CordovaDocument.ready();
      return SecureStorage.create(this.KEYSTORE).then(
        () => true,
        () => false,
      );
    });
  }
  hasRecord(store, key) {
    return __awaiter(this, void 0, void 0, function* () {
      let keys = yield store.keys();
      return keys.indexOf(key) > -1;
    });
  }
  getItem(name) {
    return __awaiter(this, void 0, void 0, function* () {
      yield CordovaDocument.ready();
      return SecureStorage.create(this.KEYSTORE)
        .then((store) => {
          return store.get(name).catch(() => null);
        })
        .catch(() => {
          return this.getTemp(name);
        });
    });
  }
  removeItem(name) {
    return __awaiter(this, void 0, void 0, function* () {
      yield CordovaDocument.ready();
      return SecureStorage.create(this.KEYSTORE)
        .then((store) => {
          store.remove(name);
        })
        .catch(() => {
          this.removeTemp(name);
        });
    });
  }
  setItem(name, value) {
    return __awaiter(this, void 0, void 0, function* () {
      yield CordovaDocument.ready();
      return SecureStorage.create(this.KEYSTORE)
        .then((store) => {
          store.set(name, value);
        })
        .catch(() => {
          this.setTemp(name, value);
        });
    });
  }
  clear() {
    return __awaiter(this, void 0, void 0, function* () {
      yield CordovaDocument.ready();
      return SecureStorage.create(this.KEYSTORE)
        .then((store) => {
          store.clear();
        })
        .catch(() => {
          this.clearTemp();
        });
    });
  }
  getTemp(key) {
    if (this.localData[key]) return this.localData[key];
    else return null;
  }
  setTemp(key, data) {
    this.localData[key] = data;
  }
  removeTemp(key) {
    if (this.localData[key]) {
      delete this.localData[key];
    }
  }
  clearTemp() {
    this.localData = {};
  }
}
