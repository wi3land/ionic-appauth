import { Component } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen';

import { Platform } from '@ionic/angular';
import { AuthService } from '../../../ionic-appauth/lib';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private auth: AuthService,
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(async () => {
      await this.auth.init();
      SplashScreen.hide();
    });
  }
}
