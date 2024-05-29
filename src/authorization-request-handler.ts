import {
  AuthorizationRequestHandler,
  StorageBackend,
  BasicQueryStringUtils,
  DefaultCrypto,
  AuthorizationServiceConfiguration,
  AuthorizationRequest,
  AuthorizationRequestResponse,
  StringMap,
  AuthorizationError,
  AuthorizationErrorJson,
  AuthorizationResponse,
  AuthorizationResponseJson,
} from '@openid/appauth';

import { Browser } from './auth-browser';

/** key for authorization request. */
const authorizationRequestKey = (handle: string) => {
  return `${handle}_appauth_authorization_request`;
};

/** key in local storage which represents the current authorization request. */
const AUTHORIZATION_REQUEST_HANDLE_KEY = 'appauth_current_authorization_request';
export const AUTHORIZATION_RESPONSE_KEY = 'auth_response';

export class IonicAuthorizationRequestHandler extends AuthorizationRequestHandler {
  constructor(
    private browser: Browser,
    private storage: StorageBackend,
    crypto = new DefaultCrypto(),
    utils = new BasicQueryStringUtils(),
  ) {
    super(utils, crypto);
  }

  public async performAuthorizationRequest(configuration: AuthorizationServiceConfiguration, request: AuthorizationRequest): Promise<void> {
    const handle = this.crypto.generateRandom(10);
    await this.storage.setItem(AUTHORIZATION_REQUEST_HANDLE_KEY, handle);
    await this.storage.setItem(authorizationRequestKey(handle), JSON.stringify(await request.toJson()));
    const url = this.buildRequestUrl(configuration, request);
    const returnedUrl: string | undefined = await this.browser.showWindow(url, request.redirectUri);
    //callback may come from showWindow or via another method
    if (returnedUrl != undefined) {
      await this.storage.setItem(AUTHORIZATION_RESPONSE_KEY, returnedUrl);
      this.completeAuthorizationRequestIfPossible();
    }
  }

  protected async completeAuthorizationRequest(): Promise<AuthorizationRequestResponse> {
    const handle = await this.storage.getItem(AUTHORIZATION_REQUEST_HANDLE_KEY);
    if (!handle) {
      throw new Error('Handle Not Available');
    }

    const request: AuthorizationRequest = this.getAuthorizationRequest(await this.storage.getItem(authorizationRequestKey(handle)));
    const queryParams = this.getQueryParams(await this.storage.getItem(AUTHORIZATION_RESPONSE_KEY));
    this.removeItemsFromStorage(handle);

    const state: string | undefined = queryParams['state'];
    const error: string | undefined = queryParams['error'];

    if (state !== request.state) {
      throw new Error('State Does Not Match');
    }

    return <AuthorizationRequestResponse>{
      request: request,
      response: !error ? this.getAuthorizationResponse(queryParams) : undefined,
      error: error ? this.getAuthorizationError(queryParams) : undefined,
    };
  }

  private getAuthorizationRequest(authRequest: string | null): AuthorizationRequest {
    if (authRequest == null) {
      throw new Error('No Auth Request Available');
    }
    return new AuthorizationRequest(JSON.parse(authRequest), this.crypto);
  }

  private getAuthorizationError(queryParams: StringMap): AuthorizationError {
    const authorizationErrorJSON: AuthorizationErrorJson = {
      error: queryParams['error'],
      error_description: queryParams['error_description'],
      error_uri: undefined,
      state: queryParams['state'],
    };
    return new AuthorizationError(authorizationErrorJSON);
  }

  private getAuthorizationResponse(queryParams: StringMap): AuthorizationResponse {
    const authorizationResponseJSON: AuthorizationResponseJson = {
      code: queryParams['code'],
      state: queryParams['state'],
    };
    return new AuthorizationResponse(authorizationResponseJSON);
  }

  private removeItemsFromStorage(handle: string): void {
    this.storage.removeItem(AUTHORIZATION_REQUEST_HANDLE_KEY);
    this.storage.removeItem(authorizationRequestKey(handle));
    this.storage.removeItem(AUTHORIZATION_RESPONSE_KEY);
  }

  private getQueryParams(authResponse: string | null): StringMap {
    if (authResponse != null) {
      const querySide: string = authResponse.split('#')[0];
      const parts: string[] = querySide.split('?');
      if (parts.length !== 2) throw new Error('Invalid auth response string');
      const hash = parts[1];
      return this.utils.parseQueryString(hash);
    } else {
      return {};
    }
  }
}
