import { AuthorizationRequestHandler, StorageBackend, BasicQueryStringUtils, DefaultCrypto, AuthorizationServiceConfiguration, AuthorizationRequest, AuthorizationRequestResponse } from "@openid/appauth";
import { Browser } from "./auth-browser";
export declare const AUTHORIZATION_RESPONSE_KEY = "auth_response";
export declare class IonicAuthorizationRequestHandler extends AuthorizationRequestHandler {
    private browser;
    private storage;
    private generateRandom;
    constructor(browser: Browser, storage: StorageBackend, utils?: BasicQueryStringUtils, generateRandom?: DefaultCrypto);
    performAuthorizationRequest(configuration: AuthorizationServiceConfiguration, request: AuthorizationRequest): Promise<void>;
    protected completeAuthorizationRequest(): Promise<AuthorizationRequestResponse>;
    private getAuthorizationRequest;
    private getAuthorizationError;
    private getAuthorizationResponse;
    private removeItemsFromStorage;
    private getQueryParams;
}
