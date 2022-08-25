import { Crypto } from '@openid/appauth/built/crypto_utils';
export interface EndSessionRequestJson {
    idTokenHint: string;
    postLogoutRedirectURI: string;
    state?: string;
}
export declare class EndSessionRequest {
    state: string;
    idTokenHint: string;
    postLogoutRedirectURI: string;
    constructor(request: EndSessionRequestJson, crypto?: Crypto);
    toJson(): EndSessionRequestJson;
}
