import { __awaiter } from 'tslib';
import { Browser } from '../auth-browser';
import { Browser as CapBrowser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
export class CapacitorBrowser extends Browser {
  closeWindow() {
    if (!CapBrowser) throw new Error('Capacitor Browser Is Undefined!');
    if (Capacitor.getPlatform() !== 'android') {
      CapBrowser.close();
    }
  }
  showWindow(url) {
    return __awaiter(this, void 0, void 0, function* () {
      const options = {
        url: url,
        windowName: '_self',
      };
      if (!CapBrowser) throw new Error('Capacitor Browser Is Undefined!');
      CapBrowser.addListener('browserFinished', () => {
        this.onCloseFunction();
      });
      CapBrowser.open(options);
      return;
    });
  }
}
