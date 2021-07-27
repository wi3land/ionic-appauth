import { Component, OnInit, OnDestroy } from '@angular/core';
import { IAuthAction, AuthActions, AuthService, AuthObserver } from 'ionic-appauth';
import { NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  user$ = this.auth.user$;
  events$ = this.auth.events$;
  sub: Subscription;

  constructor(
    private auth: AuthService,
    private navCtrl: NavController
  ) { }

  ngOnInit() {
    this.sub = this.auth.events$.subscribe((action) => this.onSignOutSuccess(action));
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  private onSignOutSuccess(action: IAuthAction) {
    if (action.action === AuthActions.SignOutSuccess) {
      this.navCtrl.navigateRoot('landing');
    }
  }

  public signOut() {
    this.auth.signOut();
  }

  public async getUserInfo(): Promise<void> {
    this.auth.loadUserInfo();
  }

  public async refreshToken(): Promise<void> {
    this.auth.refreshToken();
  }

}
