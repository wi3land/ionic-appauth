import { IAuthSession, DefaultAuthSession } from './auth-session';
import { AuthorizationRequestHandler, TokenError } from '@openid/appauth';
import { IAuthAction, AuthActionBuilder, AuthActions } from './auth-action';
import { IonicUserInfoHandler, UserInfoHandler } from './user-info-request-handler';
import { IonicEndSessionHandler, EndSessionHandler } from './end-session-request-handler';
import { IAuthConfig } from './auth-configuration';
import { IonicAuthorizationRequestHandler, AUTHORIZATION_RESPONSE_KEY } from './authorization-request-handler';
import { Browser, DefaultBrowser } from "./auth-browser";
import { StorageBackend, Requestor, BaseTokenRequestHandler, AuthorizationServiceConfiguration, AuthorizationNotifier, TokenResponse, AuthorizationRequestJson, AuthorizationRequest, DefaultCrypto, GRANT_TYPE_AUTHORIZATION_CODE, TokenRequestJson, TokenRequest, GRANT_TYPE_REFRESH_TOKEN, AuthorizationResponse, AuthorizationError, LocalStorageBackend, JQueryRequestor, TokenRequestHandler } from '@openid/appauth';
import { EndSessionRequestJson, EndSessionRequest } from './end-session-request';
import { Observable, BehaviorSubject } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { ImplicitRequestHandler, ImplicitNotifier, IMPLICIT_RESPONSE_KEY } from './implicit-request-handler';
import { ImplicitRequest, ImplicitRequestJson, ImplicitResponseType } from './implicit-request';

const TOKEN_RESPONSE_KEY = "token_response";
const AUTH_EXPIRY_BUFFER = 10 * 60 * -1;  // 10 mins in seconds
const IS_VALID_BUFFER_KEY = 'isValidBuffer';

export class IonicAuth {

    protected configuration: AuthorizationServiceConfiguration | undefined;
    protected authConfig: IAuthConfig | undefined;
    protected authSubject : BehaviorSubject<IAuthAction> = new BehaviorSubject<IAuthAction>(AuthActionBuilder.Default());
    public authObservable : Observable<IAuthAction> = this.authSubject.asObservable()
                                                                        .pipe(map((action : IAuthAction) => this.authObservableDefaultActions(action)));


    constructor(
        protected browser : Browser = new DefaultBrowser(),
        protected storage : StorageBackend = new LocalStorageBackend(),
        protected requestor : Requestor = new JQueryRequestor(),
        protected tokenHandler: TokenRequestHandler = new BaseTokenRequestHandler(requestor),
        protected userInfoHandler: UserInfoHandler = new IonicUserInfoHandler(requestor),
        protected requestHandler : AuthorizationRequestHandler | ImplicitRequestHandler =  new IonicAuthorizationRequestHandler(browser, storage),
        protected endSessionHandler : EndSessionHandler =  new IonicEndSessionHandler(browser),
        public authSession: IAuthSession = new DefaultAuthSession()
    ){
        this.setupNotifier();
    }

    protected getAuthConfig() : IAuthConfig {
        if(!this.authConfig)
            throw new Error("AuthConfig Not Defined");

        return this.authConfig;
    }
    
    protected setupNotifier(){
        if(this.requestHandler instanceof AuthorizationRequestHandler){
            let notifier = new AuthorizationNotifier();
            this.requestHandler.setAuthorizationNotifier(notifier);
            notifier.setAuthorizationListener((request, response, error) => this.onAuthorizationNotification(request, response, error));
        }else{
            let notifier = new ImplicitNotifier();
            this.requestHandler.setImplicitNotifier(notifier);
            notifier.setImplicitListener((request, response, error) => this.onImplicitNotification(request, response, error));
        } 
    }

    protected async onImplicitNotification(request : ImplicitRequest , response : TokenResponse | null, error : TokenError | null){
        if (response != null) {   
            await this.storage.setItem(TOKEN_RESPONSE_KEY, JSON.stringify(response.toJson()));            
            this.authSubject.next(AuthActionBuilder.SignInSuccess(response));
        }else if(error != null){
            throw new Error(error.errorDescription);
        }else{
            throw new Error("Unknown Error With Authentication");
        }
    }

    protected onAuthorizationNotification(request : AuthorizationRequest , response : AuthorizationResponse | null, error : AuthorizationError | null){
        let codeVerifier : string | undefined = (request.internal != undefined && this.getAuthConfig().usePkce) ? request.internal.code_verifier : undefined;

        if (response != null) {               
            this.requestAccessToken(response.code, codeVerifier);
        }else if(error != null){
            throw new Error(error.errorDescription);
        }else{
            throw new Error("Unknown Error With Authentication");
        }
    }

    public async signIn(loginHint?: string) {
        await this.performAuthorizationRequest(loginHint);
    }

    public async signOut(){
        await this.performEndSessionRequest();
    }

    public async getUserInfo<T>() : Promise<T>{
        let token : TokenResponse | undefined = await this.getValidToken();

        if(token != undefined){
            this.authSession.user = this.userInfoHandler.performUserInfoRequest<T>(await this.getConfiguration(), token);
            return this.authSession.user;
        }
        else{
            throw new Error("Unable To Obtain User Info - No Token Available");
        } 
    }

    public async startUpAsync(){
        let token : TokenResponse | undefined;
        let tokenResponseString : string | null = await this.storage.getItem(TOKEN_RESPONSE_KEY);

        if(tokenResponseString != null){
            token = new TokenResponse(JSON.parse(tokenResponseString));
            if(token && !token.isValid()){
                token = await this.requestNewToken(token);
            }
        }

        if(!token){
            this.authSubject.next(AuthActionBuilder.AutoSignInFailed());
        }else{
            this.authSubject.next(AuthActionBuilder.AutoSignInSuccess(token));
        }   
    }

    public async AuthorizationCallBack(url: string){
        this.browser.closeWindow();
       
        if(this.requestHandler instanceof AuthorizationRequestHandler){  
            await this.storage.setItem(AUTHORIZATION_RESPONSE_KEY, url);
            this.requestHandler.completeAuthorizationRequestIfPossible();
        }else{
            await this.storage.setItem(IMPLICIT_RESPONSE_KEY, url);
            this.requestHandler.completeImplicitRequestIfPossible();
        } 
    }

    public async EndSessionCallBack(){
        this.browser.closeWindow();
        this.storage.removeItem(TOKEN_RESPONSE_KEY);
        this.authSubject.next(AuthActionBuilder.SignOutSuccess());
    }

    protected async performEndSessionRequest() : Promise<void>{
        let token : TokenResponse | undefined = this.authSession.token;

        if(token != undefined){
            let requestJson : EndSessionRequestJson = {
                postLogoutRedirectURI : this.getAuthConfig().end_session_redirect_url,
                idTokenHint: token.idToken || ''
            }
    
            let request : EndSessionRequest = new EndSessionRequest(requestJson);
            let returnedUrl : string | undefined = await this.endSessionHandler.performEndSessionRequest(await this.getConfiguration(), request); 

            //callback may come from showWindow or via another method
            if(returnedUrl != undefined){
                this.EndSessionCallBack();
            }
        }else{
            //if user has no token they should not be logged in in the first place
            this.EndSessionCallBack();
        } 
    }

    protected async performAuthorizationRequest(loginHint?: string) : Promise<void> {
        if(this.requestHandler instanceof AuthorizationRequestHandler){  
            return this.requestHandler.performAuthorizationRequest(await this.getConfiguration(), await this.getAuthorizationRequest(loginHint)); 
        }else{
            return this.requestHandler.performImplicitRequest(await this.getConfiguration(), await this.getImplicitRequest(loginHint)); 
        }        
    }

    protected async getAuthorizationRequest(loginHint?: string){
        let authConfig : IAuthConfig = this.getAuthConfig();
        let requestJson : AuthorizationRequestJson = {
            response_type: authConfig.response_type || AuthorizationRequest.RESPONSE_TYPE_CODE,
            client_id: authConfig.identity_client,
            redirect_uri: authConfig.redirect_url,
            scope: authConfig.scopes,
            extras: authConfig.auth_extras
        }

        if(loginHint){
            requestJson.extras = requestJson.extras || {};
            requestJson.extras['login_hint'] = loginHint;
        }
        
        let request = new AuthorizationRequest(requestJson, new DefaultCrypto(), authConfig.usePkce);

        if(authConfig.usePkce)
            await request.setupCodeVerifier();

        return request;
    }

    protected async getImplicitRequest(loginHint?: string){
        let authConfig : IAuthConfig = this.getAuthConfig();
        let requestJson : ImplicitRequestJson = {
            response_type: authConfig.response_type || ImplicitResponseType.IdTokenToken,
            client_id: authConfig.identity_client,
            redirect_uri: authConfig.redirect_url,
            scope: authConfig.scopes,
            extras: authConfig.auth_extras
        }

        if(loginHint){
            requestJson.extras = requestJson.extras || {};
            requestJson.extras['login_hint'] = loginHint;
        }

        return new ImplicitRequest(requestJson, new DefaultCrypto());
    }

    protected async getConfiguration() : Promise<AuthorizationServiceConfiguration>{
        if(!this.configuration){
            this.configuration = await AuthorizationServiceConfiguration.fetchFromIssuer(this.getAuthConfig().identity_server,this.requestor).catch(()=> undefined);
        }
        
        if(this.configuration != undefined){
            return this.configuration;
        }else{
            throw new Error("Unable To Obtain Server Configuration");
        }
    }

    protected async requestAccessToken(code : string, codeVerifier?: string) : Promise<void> {
        let authConfig : IAuthConfig = this.getAuthConfig();
        let requestJSON: TokenRequestJson = {
          grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
          code: code,
          refresh_token: undefined,
          redirect_uri: authConfig.redirect_url,
          client_id: authConfig.identity_client,
          extras: (codeVerifier) ? { 
            "code_verifier": codeVerifier
          } : {}

        }
        
        let token : TokenResponse = await this.tokenHandler.performTokenRequest(await this.getConfiguration(), new TokenRequest(requestJSON));

        if(token != undefined){
            await this.storage.setItem(TOKEN_RESPONSE_KEY, JSON.stringify(token.toJson()));
            this.authSubject.next(AuthActionBuilder.SignInSuccess(token))
        }else{
            this.authSubject.next(AuthActionBuilder.SignOutFailed())
        }
    }
    
    public async requestRefreshToken(tokenResponse : TokenResponse) : Promise<void> {
        let authConfig : IAuthConfig = this.getAuthConfig();
        let requestJSON: TokenRequestJson = {
          grant_type: GRANT_TYPE_REFRESH_TOKEN,
          code: undefined,
          refresh_token: tokenResponse.refreshToken,
          redirect_uri: authConfig.redirect_url,
          client_id: authConfig.identity_client,
        }    
        
        let token : TokenResponse = await this.tokenHandler.performTokenRequest(await this.getConfiguration(), new TokenRequest(requestJSON));

        if(token != undefined){
            await this.storage.setItem(TOKEN_RESPONSE_KEY, JSON.stringify(token.toJson()));
            this.authSubject.next(AuthActionBuilder.RefreshSuccess(token))
        }else{
            this.storage.removeItem(TOKEN_RESPONSE_KEY);
            this.authSubject.next(AuthActionBuilder.RefreshFailed())
        }
    }

    public async getValidToken(){
        let token : TokenResponse | undefined = this.authSession.token;

        if(token == undefined)
            throw new Error("Unable To Obtain Token - No Token Available");

        // The buffer parameter passed to token.isValid().
        let isValidBuffer = AUTH_EXPIRY_BUFFER;

        const authConfig : IAuthConfig = this.getAuthConfig();

        // See if a IS_VALID_BUFFER_KEY is specified in the config extras,
        // to specify a buffer parameter for token.isValid().
        if (authConfig.auth_extras) {
            if (authConfig.auth_extras.hasOwnProperty(IS_VALID_BUFFER_KEY)) {
                isValidBuffer = parseInt(authConfig.auth_extras[IS_VALID_BUFFER_KEY], 10);
            }
        }

        if(!token.isValid(isValidBuffer)){
            token = await this.requestNewToken(token);
        }

        return token;
    }

    protected async requestNewToken(token: TokenResponse){
        await this.requestRefreshToken(token);
        return this.authSession.token;       
    }

    protected async getTokenFromObserver() : Promise<TokenResponse | undefined> {
        return this.authSubject.pipe(take(1)).toPromise().then((action : IAuthAction) => action.tokenResponse);
    }

    private authObservableDefaultActions(action : IAuthAction) : IAuthAction {
        this.authSession.token = action.tokenResponse;

        switch(action.action){
            case AuthActions.Default: 
                this.authSession.isAuthenticated = false;
                break;
            case AuthActions.SignInSuccess : 
            case AuthActions.AutoSignInSuccess : 
                this.authSession.isAuthenticated = true;
                this.authSession.onSignInSuccessful();
                break;
            case AuthActions.RefreshSuccess : 
                this.authSession.isAuthenticated = true;
                this.authSession.onRefreshSuccessful();
                break;
            case AuthActions.SignOutSuccess : 
                this.authSession.isAuthenticated = false;
                this.authSession.onSignOutSuccessful();
                break;
            case AuthActions.SignInFailed : 
            case AuthActions.AutoSignInFailed : 
                this.authSession.isAuthenticated = false;
                this.authSession.onSignInFailure();
                break;
            case AuthActions.RefreshFailed : 
                this.authSession.isAuthenticated = false;
                this.authSession.onRefreshFailure();
                break;
            case AuthActions.SignOutFailed : 
                this.authSession.isAuthenticated = false;
                this.authSession.onSignOutFailure();
                break;
        }
        return action;
    }
}
