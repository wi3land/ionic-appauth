import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AuthService } from 'ionic-appauth';
import { Router } from '@angular/router';

@Component({
  template: '<p>Signing Out...</p>'
})
export class EndSessionPage implements OnInit {

  constructor(
    private auth: AuthService,
    private navCtrl: NavController,
    private router: Router
  ) { }

  ngOnInit() {
    this.auth.endSessionCallback();
    this.navCtrl.navigateRoot('landing');
  }

}
