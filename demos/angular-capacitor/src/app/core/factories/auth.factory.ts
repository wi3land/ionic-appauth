import { Platform } from '@ionic/angular';
import { StorageBackend, Requestor } from '@openid/appauth';
import { AuthService, Browser } from 'ionic-appauth';
import { App } from '@capacitor/app';
import { environment } from 'src/environments/environment';
import { NgZone } from '@angular/core';

export const authFactory = (platform: Platform, ngZone: NgZone,
                            requestor: Requestor, browser: Browser,  storage: StorageBackend) => {

    const authService = new AuthService(browser, storage, requestor);
    authService.authConfig = environment.auth_config;

    if (!platform.is('cordova')) {
        authService.authConfig.redirect_url = window.location.origin + '/callback';
        authService.authConfig.end_session_redirect_url = window.location.origin + '/logout';
    }

    if (platform.is('capacitor')) {
        App.addListener('appUrlOpen', (data: any) => {
            if (data.url !== undefined) {
                ngZone.run(() => {
                    if ((data.url).indexOf(authService.authConfig.redirect_url) === 0) {
                        authService.authorizationCallback(data.url);
                    }else{
                        authService.endSessionCallback();
                    }
                });
            }
        });
    }

    return authService;
};
