import { EndSessionRequest } from './end-session-request';
import { AuthorizationServiceConfiguration, BasicQueryStringUtils } from "@openid/appauth";
import { Browser } from './auth-browser';
export interface EndSessionHandler {
    performEndSessionRequest(configuration: AuthorizationServiceConfiguration, request: EndSessionRequest): Promise<string | undefined>;
}
export declare class IonicEndSessionHandler implements EndSessionHandler {
    private browser;
    private utils;
    constructor(browser: Browser, utils?: BasicQueryStringUtils);
    performEndSessionRequest(configuration: AuthorizationServiceConfiguration, request: EndSessionRequest): Promise<string | undefined>;
    private buildRequestUrl;
}
