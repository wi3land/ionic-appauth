import { __awaiter } from 'tslib';
import { CordovaDocument } from './cordova-document';
import { Browser } from '../auth-browser';
import { SafariViewController } from '@awesome-cordova-plugins/safari-view-controller';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser';
// REQUIRES CORDOVA PLUGINS
// cordova-plugin-safariviewcontroller
// cordova-plugin-customurlscheme
// cordova-plugin-inappbrowser FROM https://github.com/Onegini/cordova-plugin-inappbrowser.git
export class CordovaBrowser extends Browser {
  closeWindow() {
    return __awaiter(this, void 0, void 0, function* () {
      yield CordovaDocument.ready();
      if (yield SafariViewController.isAvailable()) {
        try {
          SafariViewController.hide();
        } catch (_a) {}
      } else {
        if (this.inAppBrowserRef != undefined) this.inAppBrowserRef.close();
      }
    });
  }
  showWindow(url) {
    return __awaiter(this, void 0, void 0, function* () {
      yield CordovaDocument.ready();
      if (yield SafariViewController.isAvailable()) {
        let optionSafari = {
          url: url,
          showDefaultShareMenuItem: false,
          toolbarColor: '#ffffff',
        };
        SafariViewController.show(optionSafari).subscribe((result) => {
          if (result.event === 'closed') {
            this.onCloseFunction();
          }
        });
      } else {
        let options = {
          location: 'no',
          zoom: 'no',
          clearcache: 'yes',
          clearsessioncache: 'yes',
        };
        this.inAppBrowserRef = InAppBrowser.create(url, '_self', options);
        if (this.inAppBrowserRef != undefined) this.inAppBrowserRef.on('exit').subscribe(() => this.onCloseFunction());
      }
      return;
    });
  }
}
