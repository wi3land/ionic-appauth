import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { mock, instance, when, anything } from 'ts-mockito';
import { AuthorizationServiceConfigurationJson, JQueryRequestor, LocalStorageBackend, TokenResponse } from '@openid/appauth';
import { Browser, DefaultBrowser } from '../../src/auth-browser';
import { AuthService } from '../../src/auth-service';
import { IAuthConfig, AuthenticationType } from '../../src/auth-configuration';
import { AuthObserver } from '../../src/auth-observer';
import { AuthActions, IAuthAction } from '../../src/auth-action';

chai.use(chaiAsPromised);
const TOKEN_RESPONSE_KEY = 'token_response';
const state = 'barTest';

const token = new TokenResponse({
  access_token: 'accessToken',
  token_type: 'bearer',
  expires_in: '1000',
  refresh_token: 'refreshToken',
  id_token: 'idToken',
  issued_at: 1,
});

async function buildAuthServiceAndInit(withToken: boolean): Promise<AuthService> {
  const mockedRequestorClass: JQueryRequestor = mock(JQueryRequestor);
  const authServiceConfigJson: AuthorizationServiceConfigurationJson = {
    authorization_endpoint: '',
    token_endpoint: 'token_endpointTest',
    revocation_endpoint: 'revocation_endpointTest',
    end_session_endpoint: 'end_session_endpointTest',
    userinfo_endpoint: 'userinfo_endpointTest',
  };
  when(mockedRequestorClass.xhr<AuthorizationServiceConfigurationJson>(anything())).thenReturn(
    new Promise((resolve) => resolve(authServiceConfigJson)),
  );
  const mockedRequestor = instance(mockedRequestorClass);

  const mockedBrowserClass: Browser = mock(DefaultBrowser);
  const promiseUrlString: Promise<string | undefined> = new Promise((resolve) => {
    resolve('returnedUrlTest?state=' + state + '#');
  });
  when(mockedBrowserClass.showWindow(anything(), anything())).thenReturn(promiseUrlString);
  when(mockedBrowserClass.closeWindow()).thenReturn(new Promise(() => {}));

  const mockedBrowser = instance(mockedBrowserClass);

  const storage: Storage = new Storage();

  if (withToken) await storage.setItem(TOKEN_RESPONSE_KEY, JSON.stringify(token.toJson()));

  const authService: AuthService = new AuthService(mockedBrowser, new LocalStorageBackend(storage), mockedRequestor);

  const authConfig: IAuthConfig = {
    client_id: 'clientIdTest',
    client_secret: 'clientSecretTest',
    server_host: 'serverHostTest',
    redirect_url: 'redirectUrlTest',
    end_session_redirect_url: 'endSessionRedirectTest',
    scopes: `${AuthenticationType.Token}scopesTest`,
    pkce: false,
  };
  authService.authConfig = authConfig;
  await authService.init();
  await authService.signIn(undefined, state);
  return authService;
}

describe('auth service Tests', () => {
  it(`should do without error init, signin and signOut`, async () => {
    const authService: AuthService = await buildAuthServiceAndInit(true);

    await authService.signOut();
  });

  it(`should do without error init, signin and get valid token`, async () => {
    const authService: AuthService = await buildAuthServiceAndInit(true);

    const tokenResp: TokenResponse = await authService.getValidToken();
    chai.expect(tokenResp.tokenType).to.equal(token.tokenType);
  });

  it(`should do without error init, signin and throw get valid token error`, async () => {
    const authService: AuthService = await buildAuthServiceAndInit(false);

    await chai.expect(authService.getValidToken()).to.be.rejectedWith('Unable To Obtain Valid Token');
  });

  it(`should do without error init, signin and add action listener`, async () => {
    const authService: AuthService = await buildAuthServiceAndInit(false);
    authService.addActionListener(() => {});
  });
  it(`should do without error init, signin with authorization callback, load user info and end session callback`, async () => {
    const authService: AuthService = await buildAuthServiceAndInit(false);
    await authService.authorizationCallback('callbackUrl');
    await authService.loadUserInfo();
    const action: IAuthAction = {
      action: AuthActions.SignInFailed,
    };
    await authService.removeActionObserver(AuthObserver.Create((action) => {}));
    await authService.endSessionCallback();
  });

  it(`should do without error init, signin, revoke tokens`, async () => {
    const authService: AuthService = await buildAuthServiceAndInit(true);
    await authService.revokeTokens();
  });

  it(`should do without error init, signin and revoke tokens failed`, async () => {
    const authService: AuthService = await buildAuthServiceAndInit(false);
    await authService.revokeTokens();
  });

  it(`should do without error init, signin and refresh tokens and load user info`, async () => {
    const authService: AuthService = await buildAuthServiceAndInit(true);
    await authService.refreshToken();
    await authService.loadUserInfo();
  });

  it(`should do without error init, signin and refresh tokens failed`, async () => {
    const authService: AuthService = await buildAuthServiceAndInit(false);
    await authService.refreshToken();
  });
});
