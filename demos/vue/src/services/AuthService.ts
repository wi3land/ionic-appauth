import { App } from '@capacitor/app';
import { AuthService } from 'ionic-appauth';
import { CapacitorBrowser, CapacitorSecureStorage } from 'ionic-appauth/lib/capacitor';
import { isPlatform } from '@ionic/vue';
import { AxiosRequestor } from './AxiosService';


export class Auth  {

  private static authService : AuthService | undefined;

  private static buildAuthInstance() {
    const authService = new AuthService(new CapacitorBrowser(), new CapacitorSecureStorage(), new AxiosRequestor());
    authService.authConfig = {
      client_id: 'appauth',
      server_host: 'https://localhost:5001',
      redirect_url: isPlatform('capacitor') ? 'com.appauth.demo://callback' : window.location.origin + '/authcallback',
      end_session_redirect_url: isPlatform('capacitor') ?  'com.appauth.demo://endSession' : window.location.origin + '/endsession',
      scopes: 'openid offline_access',
      pkce: true
    }

    if (isPlatform('capacitor')) {
      App.addListener('appUrlOpen', (data: any) => {
        if ((data.url).indexOf(authService.authConfig.redirect_url) === 0) {
          authService.authorizationCallback(data.url);
        }else{
            authService.endSessionCallback();
        }
      });
    }
    
    authService.init();
    return authService;
  }

  public static get Instance() : AuthService {
    if (!this.authService) {
      this.authService = this.buildAuthInstance();
    }

    return this.authService;
  }
}
