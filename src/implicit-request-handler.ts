import {
    AuthorizationServiceConfiguration,
    BasicQueryStringUtils,
    DefaultCrypto,
    Crypto,
    StorageBackend,
    StringMap,
    QueryStringUtils,
    TokenError,
    TokenResponse,
    TokenResponseJson,
    TokenErrorJson,
    ErrorType,
    TokenType,
    log,
} from "@openid/appauth";

import { Browser } from "./auth-browser";
import { ImplicitRequest } from './implicit-request';

/** key for implicit request. */
const implicitRequestKey =
    (handle: string) => {
        return `${handle}_appauth_implicit_request`;
    }

/** key in local storage which represents the current implicit request. */
const IMPLICIT_REQUEST_HANDLE_KEY = 'appauth_current_implicit_request';
export const IMPLICIT_RESPONSE_KEY = "implicit_response";

/**
 * This type represents a lambda that can take an ImplicitRequest,
 * and an TokenResponse as arguments.
 */
export type ImplicitListener =
    (request: ImplicitRequest,
     response: TokenResponse|null,
     error: TokenError|null) => void;

/**
 * Represents a structural type holding both Implicit request and response.
 */
export interface ImplicitRequestResponse {
  request: ImplicitRequest;
  response: TokenResponse|null;
  error: TokenError|null;
}

/**
 * Implicit Service notifier.
 * This manages the communication of the TokenResponse to the 3p client.
 */
export class ImplicitNotifier {
  private listener: ImplicitListener|null = null;

  setImplicitListener(listener: ImplicitListener) {
    this.listener = listener;
  }

  /**
   * The Implicit complete callback.
   */
  onImplicitComplete(
      request: ImplicitRequest,
      response: TokenResponse|null,
      error: TokenError|null): void {
    if (this.listener) {
      // complete Implicit request
      this.listener(request, response, error);
    }
  }
}
// TODO(rahulrav@): add more built in parameters.
/* built in parameters. */
export const BUILT_IN_PARAMETERS = ['redirect_uri', 'client_id', 'response_type', 'state', 'scope'];

/**
 * Defines the interface which is capable of handling an Implicit request
 * using various methods (iframe / popup / different process etc.).
 */
export abstract class ImplicitRequestHandler {
  constructor(public utils: QueryStringUtils, protected crypto: Crypto) {}

  // notifier send the response back to the client.
  protected notifier: ImplicitNotifier|null = null;

  /**
   * A utility method to be able to build the Implicit request URL.
   */
  protected buildRequestUrl(
      configuration: AuthorizationServiceConfiguration,
      request: ImplicitRequest) {
    // build the query string
    // coerce to any type for convenience
    let requestMap: StringMap = {
      'redirect_uri': request.redirectUri,
      'client_id': request.clientId,
      'response_type': request.responseType,
      'state': request.state,
      'scope': request.scope,
      'nonce': request.nonce
    };

    // copy over extras
    if (request.extras) {
      for (let extra in request.extras) {
        if (request.extras.hasOwnProperty(extra)) {
          // check before inserting to requestMap
          if (BUILT_IN_PARAMETERS.indexOf(extra) < 0) {
            requestMap[extra] = request.extras[extra];
          }
        }
      }
    }

    let query = this.utils.stringify(requestMap);
    let baseUrl = configuration.authorizationEndpoint;
    let url = `${baseUrl}?${query}`;
    return url;
  }

  
  /**
   * Completes the Implicit request if necessary & when possible.
   */
  completeImplicitRequestIfPossible(): Promise<void> {
    // call complete Implicit if possible to see there might
    // be a response that needs to be delivered.
    log(`Checking to see if there is an Implicit response to be delivered.`);
    if (!this.notifier) {
      log(`Notifier is not present on ImplicitRequest handler.
          No delivery of result will be possible`)
    }
    return this.completeImplicitRequest().then(result => {
      if (!result) {
        log(`No result is available yet.`);
      }
      if (result && this.notifier) {
        this.notifier.onImplicitComplete(result.request, result.response, result.error);
      }
    });
  }

  /**
   * Sets the default Implicit Service notifier.
   */
  setImplicitNotifier(notifier: ImplicitNotifier): ImplicitRequestHandler {
    this.notifier = notifier;
    return this;
  };

  /**
   * Makes an Implicit request.
   */
  abstract performImplicitRequest(
      configuration: AuthorizationServiceConfiguration,
      request: ImplicitRequest): void;

  /**
   * Checks if an Implicit flow can be completed, and completes it.
   * The handler returns a `Promise<ImplicitRequestResponse>` if ready, or a `Promise<null>`
   * if not ready.
   */
  protected abstract completeImplicitRequest(): Promise<ImplicitRequestResponse|null>;
}

export class IonicImplicitRequestHandler extends ImplicitRequestHandler {

    constructor(
        private browser : Browser,
        private storage : StorageBackend,
        utils = new BasicQueryStringUtils(),
        private generateRandom = new DefaultCrypto(),
        ) {
        super(utils, generateRandom);
    }

    public async performImplicitRequest(configuration: AuthorizationServiceConfiguration, request: ImplicitRequest) : Promise<void> {
        let handle = this.generateRandom.generateRandom(10);
        this.storage.setItem(IMPLICIT_REQUEST_HANDLE_KEY, handle);
        this.storage.setItem(implicitRequestKey(handle), JSON.stringify(await request.toJson()));
        let url = this.buildRequestUrl(configuration, request);
        let returnedUrl : string | undefined = await this.browser.showWindow(url, request.redirectUri); 

        //callback may come from showWindow or via another method
        if(returnedUrl != undefined){
            await this.storage.setItem(IMPLICIT_RESPONSE_KEY, url);
            this.completeImplicitRequest();
        }
    }

    protected async completeImplicitRequest(): Promise<ImplicitRequestResponse> {
        let handle = await this.storage.getItem(IMPLICIT_REQUEST_HANDLE_KEY);
        
        if (!handle) {
            throw new Error("Handle Not Available");
        }

        let request : ImplicitRequest = this.getImplicitRequest(await this.storage.getItem(implicitRequestKey(handle)));
        let queryParams =  this.getQueryParams(await this.storage.getItem(IMPLICIT_RESPONSE_KEY));
        this.removeItemsFromStorage(handle);

        let state: string | undefined = queryParams['state'];
        let error: string | undefined = queryParams['error'];

        if (state !== request.state) {
            throw new Error("State Does Not Match");
        }

        return  {
            request: request,
            response: (!error) ? this.getImplicitResponse(queryParams) : null,
            error: (error) ? this.getImplicitError(queryParams) : null
        }
        
    }

    private getImplicitRequest(authRequest : string | null): ImplicitRequest  {
        if(authRequest == null){
            throw new Error("No Auth Request Available");
        }

        return new ImplicitRequest(JSON.parse(authRequest));
    }

    private getImplicitError(queryParams : StringMap): TokenError  {
        let implicitErrorJSON : TokenErrorJson = {
            error: this.convertToErrorType(queryParams['error']) ,
            error_description: queryParams['error_description'],
            error_uri: undefined
        }
        return new TokenError(implicitErrorJSON);
    }

    private getImplicitResponse(queryParams : StringMap): TokenResponse {
        let implicitResponseJSON : TokenResponseJson = {
            access_token: queryParams['access_token'],
            token_type: this.convertToTokenType(queryParams['token_type']),
            expires_in: +queryParams['expires_in'],
            refresh_token: queryParams['refresh_token'],
            scope: queryParams['scope'],
            id_token: queryParams['id_token'],
            issued_at: +queryParams['issued_at']
        }
        return new TokenResponse(implicitResponseJSON);
    }

    private convertToTokenType(type : string) : TokenType | undefined {
        return (type == 'bearer' || type == 'mac') ? type : undefined;
    }

    private convertToErrorType(type : string) : ErrorType {
        return (type == 'invalid_request' || type == 'invalid_client' || type == 'invalid_grant' || type == 'unauthorized_client' || type == 'unsupported_grant_type' || type == 'invalid_scope') ? type : 'invalid_request';
    }

    private removeItemsFromStorage(handle : string) : void {
        this.storage.removeItem(IMPLICIT_REQUEST_HANDLE_KEY);
        this.storage.removeItem(implicitRequestKey(handle));
        this.storage.removeItem(IMPLICIT_RESPONSE_KEY);
    }

    private getQueryParams(authResponse: string | null) : StringMap {
        if(authResponse != null){
            let parts = authResponse.split('#');
            if (parts.length !== 2) throw new Error("Invalid auth response string");
            let hash = parts[1];
            return this.utils.parseQueryString(hash);
        }else{
            return {};
        }
    }

}
