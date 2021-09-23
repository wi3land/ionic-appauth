import { Platform } from '@ionic/angular';
import { CordovaBrowser } from 'ionic-appauth/lib/cordova';
import { DefaultBrowser } from 'ionic-appauth';

export let browserFactory = (platform: Platform) => {
    return platform.is('cordova') ? new CordovaBrowser() : new DefaultBrowser();
};
