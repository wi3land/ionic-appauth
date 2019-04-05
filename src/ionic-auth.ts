import { IAuthAction, AuthActionBuilder } from './auth-action';
import { IonicUserInfoHandler } from './user-info-request-handler';
import { IonicEndSessionHandler } from './end-session-request-handler';
import { IAuthConfig } from './auth-configuration';
import { IonicAuthorizationRequestHandler, AUTHORIZATION_RESPONSE_KEY } from './authorization-request-handler';
import { Browser, DefaultBrowser } from "./auth-browser";
import { StorageBackend, Requestor, BaseTokenRequestHandler, AuthorizationServiceConfiguration, AuthorizationNotifier, TokenResponse, AuthorizationRequestJson, AuthorizationRequest, DefaultCrypto, GRANT_TYPE_AUTHORIZATION_CODE, TokenRequestJson, TokenRequest, GRANT_TYPE_REFRESH_TOKEN, AuthorizationResponse, AuthorizationError, LocalStorageBackend, JQueryRequestor } from '@openid/appauth';
import { EndSessionRequestJson, EndSessionRequest } from './end-session-request';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

const TOKEN_RESPONSE_KEY = "token_response";

export class IonicAuth {
    protected tokenHandler: BaseTokenRequestHandler;
    protected authorizationHandler: IonicAuthorizationRequestHandler;
    protected endSessionHandler : IonicEndSessionHandler;
    protected userInfoHandler : IonicUserInfoHandler;
    protected configuration: AuthorizationServiceConfiguration | undefined;
    protected authConfig: IAuthConfig | undefined;

    protected authSubject : BehaviorSubject<IAuthAction> = new BehaviorSubject<IAuthAction>(AuthActionBuilder.Default());
    public authObservable : Observable<IAuthAction> = this.authSubject.asObservable();

    constructor(
        protected browser : Browser = new DefaultBrowser(),
        protected storage : StorageBackend = new LocalStorageBackend(),
        protected requestor : Requestor = new JQueryRequestor()
    ){
        this.tokenHandler = new BaseTokenRequestHandler(this.requestor);
        this.userInfoHandler = new IonicUserInfoHandler(this.requestor);
        this.authorizationHandler = new IonicAuthorizationRequestHandler(this.browser, this.storage);
        this.endSessionHandler = new IonicEndSessionHandler(this.browser);
        this.setupNotifier();
    }

    protected getAuthConfig() : IAuthConfig {
        if(!this.authConfig)
            throw new Error("AuthConfig Not Defined");

        return this.authConfig;
    }
    
    private setupNotifier(){
        let notifier = new AuthorizationNotifier();
        this.authorizationHandler.setAuthorizationNotifier(notifier);
        notifier.setAuthorizationListener((request, response, error) => this.onNotification(request, response, error));
    }

    private onNotification(request : AuthorizationRequest, response : AuthorizationResponse | null, error : AuthorizationError | null){
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
            return this.userInfoHandler.performUserInfoRequest<T>(await this.getConfiguration(), token);
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
        await this.storage.setItem(AUTHORIZATION_RESPONSE_KEY, url);
        this.authorizationHandler.completeAuthorizationRequestIfPossible();
    }

    public async EndSessionCallBack(){
        this.browser.closeWindow();
        this.storage.removeItem(TOKEN_RESPONSE_KEY);
        this.authSubject.next(AuthActionBuilder.SignOutSuccess());
    }

    protected async performEndSessionRequest() : Promise<void>{
        let token : TokenResponse | undefined = await this.getTokenFromObserver();

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
        let authConfig : IAuthConfig = this.getAuthConfig();
        let requestJson : AuthorizationRequestJson = {
            response_type: AuthorizationRequest.RESPONSE_TYPE_CODE,
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

        return this.authorizationHandler.performAuthorizationRequest(await this.getConfiguration(), request); 
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
            this.storage.setItem(TOKEN_RESPONSE_KEY, JSON.stringify(token.toJson()));
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
            this.storage.setItem(TOKEN_RESPONSE_KEY, JSON.stringify(token.toJson()));
            this.authSubject.next(AuthActionBuilder.RefreshSuccess(token))
        }else{
            this.storage.removeItem(TOKEN_RESPONSE_KEY);
            this.authSubject.next(AuthActionBuilder.RefreshFailed())
        }
    }

    public async getValidToken(){
        let token : TokenResponse | undefined = await this.getTokenFromObserver();

        if(token == undefined)
            throw new Error("Unable To Obtain Token - No Token Available");

        if(!token.isValid){
            token = await this.requestNewToken(token);
        }

        return token;
    }

    protected async requestNewToken(token: TokenResponse){
        await this.requestRefreshToken(token);
        return this.getTokenFromObserver();          
    }

    protected async getTokenFromObserver() : Promise<TokenResponse | undefined>{
        return this.authSubject.pipe(take(1)).toPromise().then((action : IAuthAction) => action.tokenResponse);
    }
}
