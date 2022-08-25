import { AuthorizationServiceConfiguration, TokenResponse, Requestor } from '@openid/appauth';
export interface UserInfoHandler {
    performUserInfoRequest(configuration: AuthorizationServiceConfiguration, token: TokenResponse): Promise<any>;
}
export declare class IonicUserInfoHandler implements UserInfoHandler {
    private requestor;
    constructor(requestor: Requestor);
    performUserInfoRequest(configuration: AuthorizationServiceConfiguration, token: TokenResponse): Promise<any>;
}
