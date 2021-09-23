import { AuthorizationRequestHandler, RevokeTokenRequest, RevokeTokenRequestJson, StringMap } from '@openid/appauth';
import { IAuthAction, AuthActionBuilder, AuthActions } from './auth-action';
import { IonicUserInfoHandler, UserInfoHandler } from './user-info-request-handler';
import { IonicEndSessionHandler, EndSessionHandler } from './end-session-request-handler';
import { IAuthConfig } from './auth-configuration';
import { IonicAuthorizationRequestHandler, AUTHORIZATION_RESPONSE_KEY } from './authorization-request-handler';
import { Browser, DefaultBrowser } from "./auth-browser";
import { StorageBackend, Requestor, BaseTokenRequestHandler, AuthorizationServiceConfiguration, AuthorizationNotifier, TokenResponse, AuthorizationRequestJson, AuthorizationRequest, DefaultCrypto, GRANT_TYPE_AUTHORIZATION_CODE, TokenRequestJson, TokenRequest, GRANT_TYPE_REFRESH_TOKEN, AuthorizationResponse, AuthorizationError, LocalStorageBackend, JQueryRequestor, TokenRequestHandler } from '@openid/appauth';
import { EndSessionRequestJson, EndSessionRequest } from './end-session-request';
import { BehaviorSubject, Observable } from 'rxjs';
import { ActionHistoryObserver, AuthObserver, BaseAuthObserver, SessionObserver } from './auth-observer';
import { AuthSubject } from './auth-subject';

const TOKEN_RESPONSE_KEY = "token_response";
const AUTH_EXPIRY_BUFFER = 10 * 60 * -1;  // 10 mins in seconds

export interface IAuthService {
    signIn(authExtras?: StringMap, state?: string): void;
    signOut(state?: string, revokeTokens?: boolean): void;
    refreshToken(): void;
    loadUserInfo() : void;
    authorizationCallback(callbackUrl: string): void;
    endSessionCallback(): void;
    loadTokenFromStorage() : void;
    getValidToken(buffer?: number) : Promise<TokenResponse>;
    addActionObserver(observer : BaseAuthObserver): void;
    addActionListener(func: (action : IAuthAction) => void): AuthObserver
    removeActionObserver(observer : BaseAuthObserver) : void;
}

export class AuthService implements IAuthService {
    private _configuration?: AuthorizationServiceConfiguration;
    private _authConfig?: IAuthConfig;

    private _authSubject: AuthSubject = new AuthSubject();
    private _actionHistory: ActionHistoryObserver = new ActionHistoryObserver();
    private _session: SessionObserver = new SessionObserver();

    private _authSubjectV2 = new BehaviorSubject<IAuthAction>(AuthActionBuilder.Init());
    private _tokenSubject = new BehaviorSubject<TokenResponse>(undefined);
    private _userSubject = new BehaviorSubject<any>(undefined);
    private _authenticatedSubject  = new BehaviorSubject<boolean>(false);
    private _initComplete = new BehaviorSubject<boolean>(false);

    protected tokenHandler: TokenRequestHandler;
    protected userInfoHandler: UserInfoHandler;
    protected requestHandler : AuthorizationRequestHandler;
    protected endSessionHandler : EndSessionHandler;
    
    constructor(
        protected browser : Browser = new DefaultBrowser(),
        protected storage : StorageBackend = new LocalStorageBackend(),
        protected requestor : Requestor = new JQueryRequestor()
    ){
        this.tokenHandler = new BaseTokenRequestHandler(requestor);
        this.userInfoHandler = new IonicUserInfoHandler(requestor);
        this.requestHandler =  new IonicAuthorizationRequestHandler(browser, storage);
        this.endSessionHandler =  new IonicEndSessionHandler(browser);
    }

    /**
     * @deprecated independant observers have been replaced by Rxjs 
     * this will be removed in a future release
     * please use $ suffixed observers in future
     */
    get history() : IAuthAction[] {
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

    get token$() : Observable<TokenResponse> {
        return this._tokenSubject.asObservable();
    }

    get isAuthenticated$() : Observable<boolean> {
        return this._authenticatedSubject.asObservable();
    }

    get initComplete$() : Observable<boolean> {
        return this._initComplete.asObservable();
    }

    get user$() : Observable<any> {
        return this._userSubject.asObservable();
    }

    get events$() : Observable<IAuthAction> {
        return this._authSubjectV2.asObservable();
    }

    get authConfig(): IAuthConfig {
        if(!this._authConfig)
            throw new Error("AuthConfig Not Defined");

        return this._authConfig;
    }

    set authConfig(value: IAuthConfig) {
        this._authConfig = value;
    }

    get configuration(): Promise<AuthorizationServiceConfiguration> {
        if(!this._configuration){
            return AuthorizationServiceConfiguration.fetchFromIssuer(this.authConfig.server_host, this.requestor)
                        .catch(()=> { throw new Error("Unable To Obtain Server Configuration"); });
        }
        
        if(this._configuration != undefined){
            return Promise.resolve(this._configuration);
        }else{
            throw new Error("Unable To Obtain Server Configuration");
        }
    }

    public async init() {
        this.setupAuthorizationNotifier();
        this.loadTokenFromStorage();
        this.addActionObserver(this._actionHistory);
        this.addActionObserver(this._session);
    }

    protected notifyActionListers(action: IAuthAction){
        this._authSubjectV2.next(action);
        this._authSubject.notify(action);

        switch(action.action) {
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
                this._authenticatedSubject.next(true);
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
    }
    
    protected setupAuthorizationNotifier(){
        let notifier = new AuthorizationNotifier();
        this.requestHandler.setAuthorizationNotifier(notifier);
        notifier.setAuthorizationListener((request, response, error) => this.onAuthorizationNotification(request, response, error));
    }

    protected onAuthorizationNotification(request : AuthorizationRequest , response : AuthorizationResponse | null, error : AuthorizationError | null){
        let codeVerifier : string | undefined = (request.internal != undefined && this.authConfig.pkce) ? request.internal.code_verifier : undefined;

        if (response != null) {               
            this.requestAccessToken(response.code, codeVerifier);
        }else if(error != null){
            throw new Error(error.errorDescription);
        }else{
            throw new Error("Unknown Error With Authentication");
        }
    }

    protected async internalAuthorizationCallback(url: string){
        this.browser.closeWindow();
        await this.storage.setItem(AUTHORIZATION_RESPONSE_KEY, url);
        return this.requestHandler.completeAuthorizationRequestIfPossible();
    }

    protected async internalEndSessionCallback(){
        this.browser.closeWindow();
        this._actionHistory.clear();
        this.notifyActionListers(AuthActionBuilder.SignOutSuccess());
    }

    protected async performEndSessionRequest(state?: string) : Promise<void>{
        if(this._tokenSubject.value != undefined){
            let requestJson : EndSessionRequestJson = {
                postLogoutRedirectURI : this.authConfig.end_session_redirect_url,
                idTokenHint: this._tokenSubject.value.idToken || '',
                state: state || undefined,
            }
    
            let request : EndSessionRequest = new EndSessionRequest(requestJson);
            let returnedUrl : string | undefined = await this.endSessionHandler.performEndSessionRequest(await this.configuration, request);

            //callback may come from showWindow or via another method
            if(returnedUrl != undefined){
                this.endSessionCallback();
            }
        }else{
            //if user has no token they should not be logged in in the first place
            this.endSessionCallback();
        } 
    }

    protected async performAuthorizationRequest(authExtras?: StringMap, state?: string) : Promise<void> {
        let requestJson : AuthorizationRequestJson = {
            response_type: AuthorizationRequest.RESPONSE_TYPE_CODE,
            client_id: this.authConfig.client_id,
            redirect_uri: this.authConfig.redirect_url,
            scope: this.authConfig.scopes,
            extras: authExtras,
            state: state || undefined,
        }
        
        let request = new AuthorizationRequest(requestJson, new DefaultCrypto(), this.authConfig.pkce);

        if(this.authConfig.pkce)
            await request.setupCodeVerifier();

        return this.requestHandler.performAuthorizationRequest(await this.configuration, request);       
    }

    protected async requestAccessToken(code : string, codeVerifier?: string) : Promise<void> {
        let requestJSON: TokenRequestJson = {
          grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
          code: code,
          refresh_token: undefined,
          redirect_uri: this.authConfig.redirect_url,
          client_id: this.authConfig.client_id,
          extras: (codeVerifier) ? { 
            "code_verifier": codeVerifier,
            "client_secret": this.authConfig.client_secret,
          } : {
            "client_secret": this.authConfig.client_secret,
          }

        }
        
        let token : TokenResponse = await this.tokenHandler.performTokenRequest(await this.configuration, new TokenRequest(requestJSON));
        await this.storage.setItem(TOKEN_RESPONSE_KEY, JSON.stringify(token.toJson()));
        this.notifyActionListers(AuthActionBuilder.SignInSuccess(token))
    }

    protected async requestTokenRefresh() {
        if(!this._tokenSubject.value){
            throw new Error("No Token Defined!");
        }

        let requestJSON: TokenRequestJson = {
          grant_type: GRANT_TYPE_REFRESH_TOKEN,
          refresh_token: this._tokenSubject.value?.refreshToken,
          redirect_uri: this.authConfig.redirect_url,
          client_id: this.authConfig.client_id,
        }    
        
        let token : TokenResponse = await this.tokenHandler.performTokenRequest(await this.configuration, new TokenRequest(requestJSON))
        await this.storage.setItem(TOKEN_RESPONSE_KEY, JSON.stringify(token.toJson()));
        this.notifyActionListers(AuthActionBuilder.RefreshSuccess(token));
    }

    protected async internalLoadTokenFromStorage() {
        let token : TokenResponse | undefined;
        let tokenResponseString : string | null = await this.storage.getItem(TOKEN_RESPONSE_KEY);

        if(tokenResponseString != null){
            token = new TokenResponse(JSON.parse(tokenResponseString)); 

            if(token){
                return this.notifyActionListers(AuthActionBuilder.LoadTokenFromStorageSuccess(token));
            } 
        }

        throw new Error("No Token In Storage");
    }

    protected async requestTokenRevoke() {
        let revokeRefreshJson: RevokeTokenRequestJson = {
            token: this._tokenSubject.value.refreshToken, 
            token_type_hint: 'refresh_token',
            client_id: this.authConfig.client_id,
        } 
        
        let revokeAccessJson: RevokeTokenRequestJson = {
            token: this._tokenSubject.value.accessToken, 
            token_type_hint: 'access_token',
            client_id: this.authConfig.client_id,
        }  
        
        await this.tokenHandler.performRevokeTokenRequest(await this.configuration, new RevokeTokenRequest(revokeRefreshJson))
        await this.tokenHandler.performRevokeTokenRequest(await this.configuration, new RevokeTokenRequest(revokeAccessJson))
        await this.storage.removeItem(TOKEN_RESPONSE_KEY);
        this.notifyActionListers(AuthActionBuilder.RevokeTokensSuccess());
    }


    protected async internalRequestUserInfo(){
        if(this._tokenSubject.value){
            let userInfo = await this.userInfoHandler.performUserInfoRequest(await this.configuration, this._tokenSubject.value);
            this.notifyActionListers(AuthActionBuilder.LoadUserInfoSuccess(userInfo));
        }else{
            throw new Error("No Token Available");
        }     
    }

    public async loadTokenFromStorage() {
        await this.internalLoadTokenFromStorage().catch((response) => {
            this.notifyActionListers(AuthActionBuilder.LoadTokenFromStorageFailed(response));
        });
    }

    public async signIn(authExtras?: StringMap, state?: string) {
        await this.performAuthorizationRequest(authExtras, state).catch((response) => {
            this.notifyActionListers(AuthActionBuilder.SignInFailed(response));
        });
    }

    public async signOut(state?: string, revokeTokens?: boolean) {
        if(revokeTokens) {
            await this.revokeTokens();
        }

        await this.storage.removeItem(TOKEN_RESPONSE_KEY);

        if((await this.configuration).endSessionEndpoint){
            await this.performEndSessionRequest(state).catch((response) => { 
                this.notifyActionListers(AuthActionBuilder.SignOutFailed(response));
            });
        }
    }

    public async revokeTokens() {
        await this.requestTokenRevoke().catch((response) => { 
            this.storage.removeItem(TOKEN_RESPONSE_KEY);
            this.notifyActionListers(AuthActionBuilder.RevokeTokensFailed(response));
        });
    }


    public async refreshToken() {
        await this.requestTokenRefresh().catch((response) => { 
            this.storage.removeItem(TOKEN_RESPONSE_KEY);
            this.notifyActionListers(AuthActionBuilder.RefreshFailed(response));
        });
    }

    public async loadUserInfo() {
        await this.internalRequestUserInfo().catch((response) => { 
            this.notifyActionListers(AuthActionBuilder.LoadUserInfoFailed(response));
        });
    }

    public authorizationCallback(callbackUrl: string): void {
        this.internalAuthorizationCallback(callbackUrl).catch((response) => { 
            this.notifyActionListers(AuthActionBuilder.SignInFailed(response));
        });
    }

    public endSessionCallback(): void {
        this.internalEndSessionCallback().catch((response) => { 
            this.notifyActionListers(AuthActionBuilder.SignOutFailed(response));
        });
    }

    public async getValidToken(buffer: number = AUTH_EXPIRY_BUFFER): Promise<TokenResponse> {
        if(this._tokenSubject.value){
            if(!this._tokenSubject.value.isValid(buffer)){
                await this.refreshToken()
                if(this._tokenSubject.value){
                    return this._tokenSubject.value;
                }              
            }else{
                return this._tokenSubject.value;
            }
        }

        throw new Error("Unable To Obtain Valid Token");
    }

    /**
     * @deprecated independant observers have been replaced by Rxjs 
     * this will be removed in a future release
     * please use $ suffixed observers in future
     */
    public addActionListener(func: (action : IAuthAction) => void): AuthObserver {
        let observer: AuthObserver  = AuthObserver.Create(func);
        this.addActionObserver(observer);
        return observer;
    }

    /**
     * @deprecated independant observers have been replaced by Rxjs 
     * this will be removed in a future release
     * please use $ suffixed observers in future
     */
    public addActionObserver(observer : BaseAuthObserver): void {
        if(this._actionHistory.lastAction){
            observer.update(this._actionHistory.lastAction);
        }

        this._authSubject.attach(observer);
    }

    /**
     * @deprecated independant observers have been replaced by Rxjs 
     * this will be removed in a future release
     * please use $ suffixed observers in future
     */
    public removeActionObserver(observer : BaseAuthObserver) : void {
        this._authSubject.detach(observer);
    }
}

