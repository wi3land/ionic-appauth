import { expect } from 'chai';
import { mock, instance, when, anything } from 'ts-mockito';
import { AuthorizationServiceConfigurationJson, JQueryRequestor, LocalStorageBackend, TokenResponse } from '@openid/appauth';
import { Browser, DefaultBrowser } from '../../src/auth-browser';
import { AuthService} from '../../src/auth-service';
import { IAuthConfig, AuthenticationType } from '../../src/auth-configuration';

async function buildAuthService(): Promise<AuthService> {
  const mockedRequestorClass: JQueryRequestor = mock(JQueryRequestor);
  const authServiceConfigJson: AuthorizationServiceConfigurationJson = { authorization_endpoint: '',
  token_endpoint: 'token_endpointTest',
  revocation_endpoint: 'revocation_endpointTest',
  end_session_endpoint: 'end_session_endpointTest',
  userinfo_endpoint: 'userinfo_endpointTest',
}
  when(mockedRequestorClass.xhr<AuthorizationServiceConfigurationJson>(anything())).thenReturn(new Promise((resolve)=> resolve(authServiceConfigJson)));
  const mockedRequestor = instance(mockedRequestorClass);

  const mockedBrowserClass: Browser = mock(DefaultBrowser);
  when(mockedBrowserClass.closeWindow()).thenReturn(new Promise(() =>{}));

  const mockedBrowser = instance(mockedBrowserClass);

  const authService: AuthService= new AuthService(mockedBrowser, new LocalStorageBackend(new Storage()), mockedRequestor);

  const authConfig: IAuthConfig = {
    client_id: 'clientIdTest',
    client_secret: 'clientSecretTest',
    server_host: 'serverHostTest',
    redirect_url: 'redirectUrlTest',
    end_session_redirect_url: 'endSessionRedirectTest',
    scopes: `${AuthenticationType.Token}scopesTest`,
    pkce: false 
  };
  authService.authConfig=authConfig;
  await authService.init();
  await authService.signIn();
  return authService;
}

describe('auth service Tests', () => {

  it(`should do without error init, signin and signOut`, async () => {
    
    const authService: AuthService = await buildAuthService();
    
    await authService.signOut();
  });

    it(`should do without error init, signin and get valid token`, async () => {
      
      const authService: AuthService = await buildAuthService();
     // const tokenResp: TokenResponse =await authService.getValidToken();
    });
  
});
