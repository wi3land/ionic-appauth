import { AuthorizationServiceConfiguration, TokenResponse, Requestor } from '@openid/appauth';

export class IonicUserInfoHandler {

    constructor( 
        private requestor : Requestor
        ) {}

    public async performUserInfoRequest<T>(configuration: AuthorizationServiceConfiguration, token : TokenResponse): Promise<T> {
        let settings : JQueryAjaxSettings = {
            url : configuration.userInfoEndpoint,
            dataType: 'json',
            method: 'GET',
            headers : {
                "Authorization": `${token.tokenType} ${token.accessToken}`,
                "Content-Type": "application/json"
            } 
        }

        return this.requestor.xhr<T>(settings);
    }
}