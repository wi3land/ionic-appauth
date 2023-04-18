import { __awaiter } from 'tslib';
import { RevokeTokenRequest } from '@openid/appauth';
import { AuthActionBuilder, AuthActions } from './auth-action';
import { IonicUserInfoHandler } from './user-info-request-handler';
import { IonicEndSessionHandler } from './end-session-request-handler';
import { IonicAuthorizationRequestHandler, AUTHORIZATION_RESPONSE_KEY } from './authorization-request-handler';
import { DefaultBrowser } from './auth-browser';
import {
  BaseTokenRequestHandler,
  AuthorizationServiceConfiguration,
  AuthorizationNotifier,
  TokenResponse,
  AuthorizationRequest,
  DefaultCrypto,
  GRANT_TYPE_AUTHORIZATION_CODE,
  TokenRequest,
  GRANT_TYPE_REFRESH_TOKEN,
  LocalStorageBackend,
  JQueryRequestor,
} from '@openid/appauth';
import { EndSessionRequest } from './end-session-request';
import { BehaviorSubject } from 'rxjs';
import { ActionHistoryObserver, AuthObserver, SessionObserver } from './auth-observer';
import { AuthSubject } from './auth-subject';
const TOKEN_RESPONSE_KEY = 'token_response';
const AUTH_EXPIRY_BUFFER = 10 * 60 * -1; // 10 mins in seconds
export class AuthService {
  constructor(browser = new DefaultBrowser(), storage = new LocalStorageBackend(), requestor = new JQueryRequestor()) {
    this.browser = browser;
    this.storage = storage;
    this.requestor = requestor;
    this._authSubject = new AuthSubject();
    this._actionHistory = new ActionHistoryObserver();
    this._session = new SessionObserver();
    this._authSubjectV2 = new BehaviorSubject(AuthActionBuilder.Init());
    this._tokenSubject = new BehaviorSubject(undefined);
    this._userSubject = new BehaviorSubject(undefined);
    this._authenticatedSubject = new BehaviorSubject(false);
    this._initComplete = new BehaviorSubject(false);
    this.tokenHandler = new BaseTokenRequestHandler(requestor);
    this.userInfoHandler = new IonicUserInfoHandler(requestor);
    this.requestHandler = new IonicAuthorizationRequestHandler(browser, storage);
    this.endSessionHandler = new IonicEndSessionHandler(browser);
  }
  /**
   * @deprecated independant observers have been replaced by Rxjs
   * this will be removed in a future release
   * please use $ suffixed observers in future
   */
  get history() {
    return this._actionHistory.history.slice(0);
  }
  /**
   * @deprecated independant observers have been replaced by Rxjs
   * this will be removed in a future release
   * please use $ suffixed observers in future
   */
  get session() {
    return this._session.session;
  }
  get token$() {
    return this._tokenSubject.asObservable();
  }
  get isAuthenticated$() {
    return this._authenticatedSubject.asObservable();
  }
  get initComplete$() {
    return this._initComplete.asObservable();
  }
  get user$() {
    return this._userSubject.asObservable();
  }
  get events$() {
    return this._authSubjectV2.asObservable();
  }
  get authConfig() {
    if (!this._authConfig) throw new Error('AuthConfig Not Defined');
    return this._authConfig;
  }
  set authConfig(value) {
    this._authConfig = value;
  }
  get configuration() {
    if (!this._configuration) {
      return AuthorizationServiceConfiguration.fetchFromIssuer(this.authConfig.server_host, this.requestor).catch(() => {
        throw new Error('Unable To Obtain Server Configuration');
      });
    }
    if (this._configuration != undefined) {
      return Promise.resolve(this._configuration);
    } else {
      throw new Error('Unable To Obtain Server Configuration');
    }
  }
  init() {
    return __awaiter(this, void 0, void 0, function* () {
      this.setupAuthorizationNotifier();
      this.loadTokenFromStorage();
      this.addActionObserver(this._actionHistory);
      this.addActionObserver(this._session);
    });
  }
  notifyActionListers(action) {
    switch (action.action) {
      case AuthActions.RefreshFailed:
      case AuthActions.SignInFailed:
      case AuthActions.SignOutSuccess:
      case AuthActions.SignOutFailed:
        this._tokenSubject.next(undefined);
        this._userSubject.next(undefined);
        this._authenticatedSubject.next(false);
        break;
      case AuthActions.LoadTokenFromStorageFailed:
        this._tokenSubject.next(undefined);
        this._userSubject.next(undefined);
        this._authenticatedSubject.next(false);
        this._initComplete.next(true);
        break;
      case AuthActions.SignInSuccess:
      case AuthActions.RefreshSuccess:
        this._tokenSubject.next(action.tokenResponse);
        this._authenticatedSubject.next(true);
        break;
      case AuthActions.LoadTokenFromStorageSuccess:
        this._tokenSubject.next(action.tokenResponse);
        this._authenticatedSubject.next(action.tokenResponse.isValid(0));
        this._initComplete.next(true);
        break;
      case AuthActions.RevokeTokensSuccess:
        this._tokenSubject.next(undefined);
        break;
      case AuthActions.LoadUserInfoSuccess:
        this._userSubject.next(action.user);
        break;
      case AuthActions.LoadUserInfoFailed:
        this._userSubject.next(undefined);
        break;
    }
    this._authSubjectV2.next(action);
    this._authSubject.notify(action);
  }
  setupAuthorizationNotifier() {
    let notifier = new AuthorizationNotifier();
    this.requestHandler.setAuthorizationNotifier(notifier);
    notifier.setAuthorizationListener((request, response, error) => this.onAuthorizationNotification(request, response, error));
  }
  onAuthorizationNotification(request, response, error) {
    let codeVerifier = request.internal != undefined && this.authConfig.pkce ? request.internal.code_verifier : undefined;
    if (response != null) {
      this.requestAccessToken(response.code, codeVerifier);
    } else if (error != null) {
      throw new Error(error.errorDescription);
    } else {
      throw new Error('Unknown Error With Authentication');
    }
  }
  internalAuthorizationCallback(url) {
    return __awaiter(this, void 0, void 0, function* () {
      this.browser.closeWindow();
      yield this.storage.setItem(AUTHORIZATION_RESPONSE_KEY, url);
      return this.requestHandler.completeAuthorizationRequestIfPossible();
    });
  }
  internalEndSessionCallback() {
    return __awaiter(this, void 0, void 0, function* () {
      this.browser.closeWindow();
      this._actionHistory.clear();
      this.notifyActionListers(AuthActionBuilder.SignOutSuccess());
    });
  }
  performEndSessionRequest(state) {
    return __awaiter(this, void 0, void 0, function* () {
      if (this._tokenSubject.value != undefined) {
        let requestJson = {
          postLogoutRedirectURI: this.authConfig.end_session_redirect_url,
          idTokenHint: this._tokenSubject.value.idToken || '',
          state: state || undefined,
        };
        let request = new EndSessionRequest(requestJson);
        let returnedUrl = yield this.endSessionHandler.performEndSessionRequest(yield this.configuration, request);
        //callback may come from showWindow or via another method
        if (returnedUrl != undefined) {
          this.endSessionCallback();
        }
      } else {
        //if user has no token they should not be logged in in the first place
        this.endSessionCallback();
      }
    });
  }
  performAuthorizationRequest(authExtras, state) {
    return __awaiter(this, void 0, void 0, function* () {
      let requestJson = {
        response_type: AuthorizationRequest.RESPONSE_TYPE_CODE,
        client_id: this.authConfig.client_id,
        redirect_uri: this.authConfig.redirect_url,
        scope: this.authConfig.scopes,
        extras: authExtras,
        state: state || undefined,
      };
      let request = new AuthorizationRequest(requestJson, new DefaultCrypto(), this.authConfig.pkce);
      if (this.authConfig.pkce) yield request.setupCodeVerifier();
      return this.requestHandler.performAuthorizationRequest(yield this.configuration, request);
    });
  }
  requestAccessToken(code, codeVerifier) {
    return __awaiter(this, void 0, void 0, function* () {
      let requestJSON = {
        grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
        code: code,
        refresh_token: undefined,
        redirect_uri: this.authConfig.redirect_url,
        client_id: this.authConfig.client_id,
        extras: codeVerifier
          ? {
              code_verifier: codeVerifier,
              client_secret: this.authConfig.client_secret,
            }
          : {
              client_secret: this.authConfig.client_secret,
            },
      };
      let token = yield this.tokenHandler.performTokenRequest(yield this.configuration, new TokenRequest(requestJSON));
      yield this.storage.setItem(TOKEN_RESPONSE_KEY, JSON.stringify(token.toJson()));
      this.notifyActionListers(AuthActionBuilder.SignInSuccess(token));
    });
  }
  requestTokenRefresh() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
      if (!this._tokenSubject.value) {
        throw new Error('No Token Defined!');
      }
      let requestJSON = {
        grant_type: GRANT_TYPE_REFRESH_TOKEN,
        refresh_token: (_a = this._tokenSubject.value) === null || _a === void 0 ? void 0 : _a.refreshToken,
        redirect_uri: this.authConfig.redirect_url,
        client_id: this.authConfig.client_id,
      };
      let token = yield this.tokenHandler.performTokenRequest(yield this.configuration, new TokenRequest(requestJSON));
      yield this.storage.setItem(TOKEN_RESPONSE_KEY, JSON.stringify(token.toJson()));
      this.notifyActionListers(AuthActionBuilder.RefreshSuccess(token));
    });
  }
  internalLoadTokenFromStorage() {
    return __awaiter(this, void 0, void 0, function* () {
      let token;
      let tokenResponseString = yield this.storage.getItem(TOKEN_RESPONSE_KEY);
      if (tokenResponseString != null) {
        token = new TokenResponse(JSON.parse(tokenResponseString));
        if (token) {
          return this.notifyActionListers(AuthActionBuilder.LoadTokenFromStorageSuccess(token));
        }
      }
      throw new Error('No Token In Storage');
    });
  }
  requestTokenRevoke() {
    return __awaiter(this, void 0, void 0, function* () {
      let revokeRefreshJson = {
        token: this._tokenSubject.value.refreshToken,
        token_type_hint: 'refresh_token',
        client_id: this.authConfig.client_id,
      };
      let revokeAccessJson = {
        token: this._tokenSubject.value.accessToken,
        token_type_hint: 'access_token',
        client_id: this.authConfig.client_id,
      };
      yield this.tokenHandler.performRevokeTokenRequest(yield this.configuration, new RevokeTokenRequest(revokeRefreshJson));
      yield this.tokenHandler.performRevokeTokenRequest(yield this.configuration, new RevokeTokenRequest(revokeAccessJson));
      yield this.storage.removeItem(TOKEN_RESPONSE_KEY);
      this.notifyActionListers(AuthActionBuilder.RevokeTokensSuccess());
    });
  }
  internalRequestUserInfo() {
    return __awaiter(this, void 0, void 0, function* () {
      if (this._tokenSubject.value) {
        let userInfo = yield this.userInfoHandler.performUserInfoRequest(yield this.configuration, this._tokenSubject.value);
        this.notifyActionListers(AuthActionBuilder.LoadUserInfoSuccess(userInfo));
      } else {
        throw new Error('No Token Available');
      }
    });
  }
  loadTokenFromStorage() {
    return __awaiter(this, void 0, void 0, function* () {
      yield this.internalLoadTokenFromStorage().catch((response) => {
        this.notifyActionListers(AuthActionBuilder.LoadTokenFromStorageFailed(response));
      });
    });
  }
  signIn(authExtras, state) {
    return __awaiter(this, void 0, void 0, function* () {
      yield this.performAuthorizationRequest(authExtras, state).catch((response) => {
        this.notifyActionListers(AuthActionBuilder.SignInFailed(response));
      });
    });
  }
  signOut(state, revokeTokens) {
    return __awaiter(this, void 0, void 0, function* () {
      if (revokeTokens) {
        yield this.revokeTokens();
      }
      yield this.storage.removeItem(TOKEN_RESPONSE_KEY);
      if ((yield this.configuration).endSessionEndpoint) {
        yield this.performEndSessionRequest(state).catch((response) => {
          this.notifyActionListers(AuthActionBuilder.SignOutFailed(response));
        });
      }
    });
  }
  revokeTokens() {
    return __awaiter(this, void 0, void 0, function* () {
      yield this.requestTokenRevoke().catch((response) => {
        this.storage.removeItem(TOKEN_RESPONSE_KEY);
        this.notifyActionListers(AuthActionBuilder.RevokeTokensFailed(response));
      });
    });
  }
  refreshToken() {
    return __awaiter(this, void 0, void 0, function* () {
      yield this.requestTokenRefresh().catch((response) => {
        this.storage.removeItem(TOKEN_RESPONSE_KEY);
        this.notifyActionListers(AuthActionBuilder.RefreshFailed(response));
      });
    });
  }
  loadUserInfo() {
    return __awaiter(this, void 0, void 0, function* () {
      yield this.internalRequestUserInfo().catch((response) => {
        this.notifyActionListers(AuthActionBuilder.LoadUserInfoFailed(response));
      });
    });
  }
  authorizationCallback(callbackUrl) {
    this.internalAuthorizationCallback(callbackUrl).catch((response) => {
      this.notifyActionListers(AuthActionBuilder.SignInFailed(response));
    });
  }
  endSessionCallback() {
    this.internalEndSessionCallback().catch((response) => {
      this.notifyActionListers(AuthActionBuilder.SignOutFailed(response));
    });
  }
  getValidToken(buffer = AUTH_EXPIRY_BUFFER) {
    return __awaiter(this, void 0, void 0, function* () {
      if (this._tokenSubject.value) {
        if (!this._tokenSubject.value.isValid(buffer)) {
          yield this.refreshToken();
          if (this._tokenSubject.value) {
            return this._tokenSubject.value;
          }
        } else {
          return this._tokenSubject.value;
        }
      }
      throw new Error('Unable To Obtain Valid Token');
    });
  }
  /**
   * @deprecated independant observers have been replaced by Rxjs
   * this will be removed in a future release
   * please use $ suffixed observers in future
   */
  addActionListener(func) {
    let observer = AuthObserver.Create(func);
    this.addActionObserver(observer);
    return observer;
  }
  /**
   * @deprecated independant observers have been replaced by Rxjs
   * this will be removed in a future release
   * please use $ suffixed observers in future
   */
  addActionObserver(observer) {
    if (this._actionHistory.lastAction) {
      observer.update(this._actionHistory.lastAction);
    }
    this._authSubject.attach(observer);
  }
  /**
   * @deprecated independant observers have been replaced by Rxjs
   * this will be removed in a future release
   * please use $ suffixed observers in future
   */
  removeActionObserver(observer) {
    this._authSubject.detach(observer);
  }
}
