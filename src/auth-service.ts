import { AuthSubject, AuthObserver } from './auth-subject';
import { AuthorizationRequestHandler, StringMap } from '@openid/appauth';
import { IAuthAction, AuthActionBuilder } from './auth-action';
import { IonicUserInfoHandler, UserInfoHandler } from './user-info-request-handler';
import { IonicEndSessionHandler, EndSessionHandler } from './end-session-request-handler';
import { IAuthConfig } from './auth-configuration';
import { IonicAuthorizationRequestHandler, AUTHORIZATION_RESPONSE_KEY } from './authorization-request-handler';
import { Browser, DefaultBrowser } from "./auth-browser";
import { StorageBackend, Requestor, BaseTokenRequestHandler, AuthorizationServiceConfiguration, AuthorizationNotifier, TokenResponse, AuthorizationRequestJson, AuthorizationRequest, DefaultCrypto, GRANT_TYPE_AUTHORIZATION_CODE, TokenRequestJson, TokenRequest, GRANT_TYPE_REFRESH_TOKEN, AuthorizationResponse, AuthorizationError, LocalStorageBackend, JQueryRequestor, TokenRequestHandler } from '@openid/appauth';
import { EndSessionRequestJson, EndSessionRequest } from './end-session-request';
import { ActionLogger } from './auth-action-logger';

const TOKEN_RESPONSE_KEY = "token_response";
const AUTH_EXPIRY_BUFFER = 10 * 60 * -1;  // 10 mins in seconds

export interface IAuthService {
    setAuthConfig(authConfig: IAuthConfig) : void; 
    signIn(auth_extras?: StringMap): void;
    signOut(): void;
    getUserInfo<T>(): Promise<T>;
    handleCallback(callbackUrl: string): boolean;
    requestRefreshToken(tokenResponse: TokenResponse): void;
    signInFromStorage() : void;
    getValidToken(buffer?: number): Promise<TokenResponse | undefined>;
}

export class AuthService implements IAuthService {

    private configuration: AuthorizationServiceConfiguration | undefined;
    private authConfig: IAuthConfig | undefined;
    private authSubject: AuthSubject = new AuthSubject();
    private actionHistory: IAuthAction[] = [];

    protected tokenHandler: TokenRequestHandler;
    protected userInfoHandler: UserInfoHandler;
    protected requestHandler : AuthorizationRequestHandler;
    protected endSessionHandler : EndSessionHandler;

    constructor(
        protected browser : Browser = new DefaultBrowser(),
        protected storage : StorageBackend = new LocalStorageBackend(),
        protected requestor : Requestor = new JQueryRequestor(),
        protected logger : ActionLogger = new ActionLogger()
    ){
        this.tokenHandler = new BaseTokenRequestHandler(requestor);
        this.userInfoHandler = new IonicUserInfoHandler(requestor);
        this.requestHandler =  new IonicAuthorizationRequestHandler(browser, storage);
        this.endSessionHandler =  new IonicEndSessionHandler(browser);

        this.setupNotifier();
        this.setupActionHistory();
        this.setupLogging();
    }

    protected getAuthConfig() : IAuthConfig {
        if(!this.authConfig)
            throw new Error("AuthConfig Not Defined");

        return this.authConfig;
    }

    public setAuthConfig(authConfig: IAuthConfig) : void {
        this.authConfig = authConfig;
    }
    
    protected setupNotifier(){
        let notifier = new AuthorizationNotifier();
        this.requestHandler.setAuthorizationNotifier(notifier);
        notifier.setAuthorizationListener((request, response, error) => this.onAuthorizationNotification(request, response, error));
    }

    private setupActionHistory(){
        this.authSubject.attach(new AuthObserver(this.actionHistory.push));
    }

    private setupLogging(){
        this.authSubject.attach(new AuthObserver(this.logger.log));
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

    public async signInFromStorage() : Promise<void> {
        let token : TokenResponse | undefined;
        let tokenResponseString : string | null = await this.storage.getItem(TOKEN_RESPONSE_KEY);

        if(tokenResponseString != null){
            token = new TokenResponse(JSON.parse(tokenResponseString));
            if(token && !token.isValid()){
                token = await this.requestNewToken(token);
            }
        }

        if(!token){
            this.authSubject.notify(AuthActionBuilder.SignInFromStorageFailed("No Token Available"));
        }else{
            this.authSubject.notify(AuthActionBuilder.SignInFromStorageSuccess(token));
        }   
    }

    public async signIn(auth_extras?: StringMap) {
        await this.performAuthorizationRequest(auth_extras).catch((response) => { 
            this.authSubject.notify(AuthActionBuilder.SignInFailed(response));
        })
    }

    public async signOut(){
        await this.performEndSessionRequest().catch((response) => { 
            this.authSubject.notify(AuthActionBuilder.SignOutFailed(response));
        })
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

    public handleCallback(callbackUrl: string): boolean {
        if ((callbackUrl).indexOf(this.getAuthConfig().redirect_url) === 0) {
          this.AuthorizationCallBack(callbackUrl);
          return true;
        }
    
        if ((callbackUrl).indexOf(this.getAuthConfig().end_session_redirect_url) === 0) {
          this.EndSessionCallBack();
          return true;
        }

        return false;
      }

    protected async AuthorizationCallBack(url: string){
        this.browser.closeWindow();
        await this.storage.setItem(AUTHORIZATION_RESPONSE_KEY, url);
        return this.requestHandler.completeAuthorizationRequestIfPossible();
    }

    protected async EndSessionCallBack(){
        this.browser.closeWindow();
        this.storage.removeItem(TOKEN_RESPONSE_KEY);
        this.authSubject.notify(AuthActionBuilder.SignOutSuccess());
    }

    protected async performEndSessionRequest() : Promise<void>{
        let token : TokenResponse | undefined = await this.getTokenFromSubject();   

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

    protected async performAuthorizationRequest(auth_extras?: StringMap) : Promise<void> {
        return this.requestHandler.performAuthorizationRequest(await this.getConfiguration(), await this.getAuthorizationRequest(auth_extras));       
    }

    protected async getAuthorizationRequest(auth_extras?: StringMap){
        let authConfig : IAuthConfig = this.getAuthConfig();
        let requestJson : AuthorizationRequestJson = {
            response_type: authConfig.response_type || AuthorizationRequest.RESPONSE_TYPE_CODE,
            client_id: authConfig.identity_client,
            redirect_uri: authConfig.redirect_url,
            scope: authConfig.scopes,
            extras: auth_extras
        }
        
        let request = new AuthorizationRequest(requestJson, new DefaultCrypto(), authConfig.usePkce);

        if(authConfig.usePkce)
            await request.setupCodeVerifier();

        return request;
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
        
        try{
            let token : TokenResponse = await this.tokenHandler.performTokenRequest(await this.getConfiguration(), new TokenRequest(requestJSON));
            await this.storage.setItem(TOKEN_RESPONSE_KEY, JSON.stringify(token.toJson()));
            this.authSubject.notify(AuthActionBuilder.SignInSuccess(token))
        }catch(error){
            this.authSubject.notify(AuthActionBuilder.SignInFailed(error))
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
        
        try{
            let token : TokenResponse = await this.tokenHandler.performTokenRequest(await this.getConfiguration(), new TokenRequest(requestJSON))
            await this.storage.setItem(TOKEN_RESPONSE_KEY, JSON.stringify(token.toJson()));
            this.authSubject.notify(AuthActionBuilder.RefreshSuccess(token));
        }catch(error){
            this.storage.removeItem(TOKEN_RESPONSE_KEY);
            this.authSubject.notify(AuthActionBuilder.RefreshFailed(error))
        }
    }

    public async getValidToken(buffer?: number) : Promise<TokenResponse | undefined> {
        let token : TokenResponse | undefined = await this.getTokenFromSubject();   

        if(token == undefined)
            throw new Error("Unable To Obtain Token - No Token Available");

        // The buffer parameter passed to token.isValid().
        let isValidBuffer = (buffer) ? buffer : AUTH_EXPIRY_BUFFER;

        if(!token.isValid(isValidBuffer)){
            token = await this.requestNewToken(token);
        }

        return token;
    }

    protected async requestNewToken(token: TokenResponse) : Promise<TokenResponse | undefined>  {
        await this.requestRefreshToken(token);
        return this.getTokenFromSubject();   
    }

    protected async getTokenFromSubject() : Promise<TokenResponse | undefined> {
        let token : TokenResponse | undefined = undefined;
        this.actionHistory.forEach((action) => {
            if(action.tokenResponse != undefined) {
                token = action.tokenResponse;
            }
        });
        return token;
    }
}

