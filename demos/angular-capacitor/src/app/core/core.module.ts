import { Platform } from '@ionic/angular';
import { Requestor, StorageBackend } from '@openid/appauth';
import { NgModule, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, Browser } from 'ionic-appauth';
import { CapacitorBrowser, DefaultBrowser, CapacitorSecureStorage } from 'ionic-appauth/lib/capacitor';
import { authFactory } from './factories';
import { httpFactory } from './factories/http.factory';
import { HttpClient } from '@angular/common/http';

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
      useFactory: httpFactory,
      deps: [Platform, HttpClient]
    },
    {
      provide: Browser,
      useFactory: (platform: Platform): Browser => platform.is("hybrid") ? new CapacitorBrowser() : new DefaultBrowser(),
      deps: [Platform]
    },
    {
      provide: AuthService,
      useFactory : authFactory,
      deps: [Platform, NgZone, Requestor, Browser, StorageBackend]
    }
  ]
})
export class CoreModule { }
