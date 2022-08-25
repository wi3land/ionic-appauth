import { __awaiter } from "tslib";
import { Storage } from '@ionic/storage';
export class IonicStorage {
    constructor() {
        this.store = new Storage();
        this.init = false;
    }
    getItem(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.init) {
                yield this.store.create();
                this.init = true;
            }
            return yield this.store.get(name);
        });
    }
    removeItem(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.init) {
                yield this.store.create();
                this.init = true;
            }
            return this.store.remove(name);
        });
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.init) {
                yield this.store.create();
                this.init = true;
            }
            return this.store.clear();
        });
    }
    setItem(name, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.init) {
                yield this.store.create();
                this.init = true;
            }
            return this.store.set(name, value);
        });
    }
}
