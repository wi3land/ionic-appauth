import { AuthorizationServiceConfiguration, TokenResponse, Requestor } from '@openid/appauth';

export interface UserInfoHandler {
    performUserInfoRequest<T>(configuration: AuthorizationServiceConfiguration, token : TokenResponse): Promise<T>
}

export class IonicUserInfoHandler implements UserInfoHandler {

    constructor( 
        private requestor : Requestor
        ) {}

    public async performUserInfoRequest<T>(configuration: AuthorizationServiceConfiguration, token : TokenResponse): Promise<T> {
        let settings : JQueryAjaxSettings = {
            url : configuration.userInfoEndpoint,
            dataType: 'json',
            method: 'GET',
            headers : {
                "Authorization": `${(token.tokenType == 'bearer') ? 'Bearer' : token.tokenType} ${token.accessToken}`,
                "Content-Type": "application/json"
            } 
        }

        return this.requestor.xhr<T>(settings);
    }
}