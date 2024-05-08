import { AuthorizationServiceConfiguration, BasicQueryStringUtils, StringMap } from '@openid/appauth';

import { Browser } from './auth-browser';
import { EndSessionRequest } from './end-session-request';

export interface EndSessionHandler {
  performEndSessionRequest(configuration: AuthorizationServiceConfiguration, request: EndSessionRequest): Promise<string | undefined>;
}

export class IonicEndSessionHandler implements EndSessionHandler {
  constructor(
    private browser: Browser,
    private utils = new BasicQueryStringUtils(),
  ) {}

  public async performEndSessionRequest(
    configuration: AuthorizationServiceConfiguration,
    request: EndSessionRequest,
  ): Promise<string | undefined> {
    const url = this.buildRequestUrl(configuration, request);
    return this.browser.showWindow(url, request.postLogoutRedirectURI);
  }

  private buildRequestUrl(configuration: AuthorizationServiceConfiguration, request: EndSessionRequest) {
    const requestMap: StringMap = {
      id_token_hint: request.idTokenHint,
      post_logout_redirect_uri: request.postLogoutRedirectURI,
      state: request.state,
    };

    const query = this.utils.stringify(requestMap);
    const baseUrl = configuration.endSessionEndpoint;
    const url = `${baseUrl}?${query}`;
    return url;
  }
}
