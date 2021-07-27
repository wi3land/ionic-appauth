import { Platform } from '@ionic/angular';
import { CordovaSecureStorage } from 'ionic-appauth/lib/cordova';
import { IonicStorage } from 'ionic-appauth/lib';

export let storageFactory = (platform: Platform) => {
    return platform.is('cordova') ? new CordovaSecureStorage() : new IonicStorage();
}