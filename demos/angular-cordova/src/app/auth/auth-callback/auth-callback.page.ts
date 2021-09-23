import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthActions, IAuthAction, AuthObserver, AuthService } from 'ionic-appauth';
import { Subscription } from 'rxjs';

@Component({
  template: '<p>Signing in...</p>'
})
export class AuthCallbackPage implements OnInit, OnDestroy {
  sub: Subscription;

  constructor(
    private auth: AuthService,
    private navCtrl: NavController,
    private router: Router
  ) { }

  ngOnInit() {
    this.sub = this.auth.events$.subscribe((action) => this.postCallback(action));
    this.auth.authorizationCallback(window.location.origin + this.router.url);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  postCallback(action: IAuthAction) {
    if (action.action === AuthActions.SignInSuccess) {
      this.navCtrl.navigateRoot('home');
    }

    if (action.action === AuthActions.SignInFailed) {
      this.navCtrl.navigateRoot('landing');
    }
  }

}
