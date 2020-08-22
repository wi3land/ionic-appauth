import { AuthSubject } from './auth-subject';
import { AuthorizationRequestHandler, StringMap } from '@openid/appauth';
import { IAuthAction, AuthActionBuilder } from './auth-action';
import { IonicUserInfoHandler, UserInfoHandler } from './user-info-request-handler';
import { IonicEndSessionHandler, EndSessionHandler } from './end-session-request-handler';
import { IAuthConfig } from './auth-configuration';
import { IonicAuthorizationRequestHandler, AUTHORIZATION_RESPONSE_KEY } from './authorization-request-handler';
import { Browser, DefaultBrowser } from "./auth-browser";
import { StorageBackend, Requestor, BaseTokenRequestHandler, AuthorizationServiceConfiguration, AuthorizationNotifier, TokenResponse, AuthorizationRequestJson, AuthorizationRequest, DefaultCrypto, GRANT_TYPE_AUTHORIZATION_CODE, TokenRequestJson, TokenRequest, GRANT_TYPE_REFRESH_TOKEN, AuthorizationResponse, AuthorizationError, LocalStorageBackend, JQueryRequestor, TokenRequestHandler } from '@openid/appauth';
import { EndSessionRequestJson, EndSessionRequest } from './end-session-request';
import { BaseAuthObserver, AuthObserver,ActionHistoryObserver, SessionObserver  } from './auth-observer';

const TOKEN_RESPONSE_KEY = "token_response";
const AUTH_EXPIRY_BUFFER = 10 * 60 * -1;  // 10 mins in seconds

export interface IAuthService {
    signIn(auth_extras?: StringMap): void;
    signOut(): void;
    refreshToken(): void;
    loadUserInfo() : void;
    handleCallback(callbackUrl: string): void;
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

        this.setupAuthorizationNotifier();
        this.addActionObserver(this._actionHistory);
        this.addActionObserver(this._session);
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

    get history() : IAuthAction[] {
        return this._actionHistory.history.slice(0);
    }

    get session() {
        return this._session.session;
    }

    protected notifyActionListers(action: IAuthAction){
        this._authSubject.notify(action);
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

    protected async AuthorizationCallBack(url: string){
        this.browser.closeWindow();
        await this.storage.setItem(AUTHORIZATION_RESPONSE_KEY, url);
        return this.requestHandler.completeAuthorizationRequestIfPossible();
    }

    protected async EndSessionCallBack(){
        this.browser.closeWindow();
        this.storage.removeItem(TOKEN_RESPONSE_KEY);
        this.notifyActionListers(AuthActionBuilder.SignOutSuccess());
    }

    protected async performEndSessionRequest() : Promise<void>{
        if(this.session.token != undefined){
            let requestJson : EndSessionRequestJson = {
                postLogoutRedirectURI : this.authConfig.end_session_redirect_url,
                idTokenHint: this.session.token?.idToken || ''
            }
    
            let request : EndSessionRequest = new EndSessionRequest(requestJson);
            let returnedUrl : string | undefined = await this.endSessionHandler.performEndSessionRequest(await this.configuration, request);

            //callback may come from showWindow or via another method
            if(returnedUrl != undefined){
                this.EndSessionCallBack();
            }
        }else{
            //if user has no token they should not be logged in in the first place
            this.EndSessionCallBack();
        } 
    }

    protected async performAuthorizationRequest(auth_extras?: StringMap) : Promise<void> {
        let requestJson : AuthorizationRequestJson = {
            response_type: AuthorizationRequest.RESPONSE_TYPE_CODE,
            client_id: this.authConfig.client_id,
            redirect_uri: this.authConfig.redirect_url,
            scope: this.authConfig.scopes,
            extras: auth_extras
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
            "code_verifier": codeVerifier
          } : {}

        }
        
        let token : TokenResponse = await this.tokenHandler.performTokenRequest(await this.configuration, new TokenRequest(requestJSON));
        await this.storage.setItem(TOKEN_RESPONSE_KEY, JSON.stringify(token.toJson()));
        this.notifyActionListers(AuthActionBuilder.SignInSuccess(token))
    }

    protected async requestTokenRefresh() {
        if(!this.session.token){
            throw new Error("No Token Defined!");
        }

        let requestJSON: TokenRequestJson = {
          grant_type: GRANT_TYPE_REFRESH_TOKEN,
          refresh_token: this.session.token?.refreshToken,
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

    protected async internalRequestUserInfo(){
        if(this.session.token){
            let userInfo = await this.userInfoHandler.performUserInfoRequest(await this.configuration, this.session.token);
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

    public async signIn(auth_extras?: StringMap) {
        await this.performAuthorizationRequest(auth_extras).catch((response) => {
            this.notifyActionListers(AuthActionBuilder.SignInFailed(response));
        });
    }

    public async signOut() {
        await this.performEndSessionRequest().catch((response) => { 
            this.notifyActionListers(AuthActionBuilder.SignOutFailed(response));
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

    public handleCallback(callbackUrl: string): void {
        if ((callbackUrl).indexOf(this.authConfig.redirect_url) === 0) {
            this.AuthorizationCallBack(callbackUrl).catch((response) => { 
                this.notifyActionListers(AuthActionBuilder.SignInFailed(response));
            });
        }
    
        if ((callbackUrl).indexOf(this.authConfig.end_session_redirect_url) === 0) {
            this.EndSessionCallBack().catch((response) => { 
                this.notifyActionListers(AuthActionBuilder.SignOutFailed(response));
            });
        }
    }

    public async getValidToken(buffer: number = AUTH_EXPIRY_BUFFER): Promise<TokenResponse> {
        if(this.session.token){
            if(!this.session.token.isValid(buffer)){
                await this.refreshToken()
                if(this.session.token){
                    return this.session.token;
                }              
            }else{
                return this.session.token;
            }
        }

        throw new Error("Unable To Obtain Valid Token");
    }

    public addActionListener(func: (action : IAuthAction) => void): AuthObserver {
        let observer: AuthObserver  = AuthObserver.Create(func);
        this.addActionObserver(observer);
        return observer;
    }

    public addActionObserver(observer : BaseAuthObserver): void {
        if(this._actionHistory.lastAction){
            observer.update(this._actionHistory.lastAction);
        }

        this._authSubject.attach(observer);
    }

    public removeActionObserver(observer : BaseAuthObserver) : void {
        this._authSubject.detach(observer);
    }
}

