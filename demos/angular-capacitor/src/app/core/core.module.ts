import { Platform } from '@ionic/angular';
import { Requestor, StorageBackend } from '@openid/appauth';
import { APP_INITIALIZER, NgModule, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Browser, AuthService } from 'ionic-appauth';
import { CapacitorBrowser, CapacitorSecureStorage } from 'ionic-appauth/lib/capacitor';

import { NgHttpService } from './ng-http.service';
import { authFactory } from './factories';

@NgModule({
  imports: [
    CommonModule
  ],
  providers: [
    {
      provide: StorageBackend,
      useClass: CapacitorSecureStorage
    },
    {
      provide: Requestor,
      useClass: NgHttpService
    },
    {
      provide: Browser,
      useClass: CapacitorBrowser
    },
    {
      provide: AuthService,
      useFactory : authFactory,
      deps: [Platform, NgZone, Requestor, Browser, StorageBackend]
    }
  ]
})
export class CoreModule { }
