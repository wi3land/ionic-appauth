import { Component, OnInit, OnDestroy } from '@angular/core';
import { IAuthAction, AuthActions, AuthService } from 'ionic-appauth';
import { NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
})
export class LandingPage implements OnInit, OnDestroy {
  events$ = this.auth.events$;
  sub: Subscription;

  constructor(
    private auth: AuthService,
    private navCtrl: NavController
  ) { }

  ngOnInit() {
    this.auth.loadTokenFromStorage();
    this.sub = this.auth.events$.subscribe((action) => this.onSignInSuccess(action));
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  private onSignInSuccess(action: IAuthAction) {
    if (action.action === AuthActions.SignInSuccess) {
      this.navCtrl.navigateRoot('home');
    }
  }

  public signIn() {
    this.auth.signIn();
  }
}
