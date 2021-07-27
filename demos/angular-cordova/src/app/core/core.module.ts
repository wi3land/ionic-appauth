import { Requestor, StorageBackend } from '@openid/appauth';
import { APP_INITIALIZER, NgModule, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Platform } from '@ionic/angular';

import { HttpClient } from '@angular/common/http';
import { browserFactory, storageFactory, httpFactory, authFactory } from './factories';
import { Browser, AuthService } from 'ionic-appauth';

@NgModule({
  imports: [
    CommonModule
  ],
  providers: [
    {
      provide: StorageBackend,
      useFactory: storageFactory,
      deps: [Platform]
    },
    {
      provide: Requestor,
      useFactory: httpFactory,
      deps: [Platform, HttpClient]
    },
    {
      provide: Browser,
      useFactory : browserFactory,
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
