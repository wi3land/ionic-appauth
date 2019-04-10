import {
    DefaultCrypto,
    Crypto,
    StringMap,
} from "@openid/appauth";

export enum ImplicitResponseType {
    Token = "token",
    IdToken = "id_token",
    IdTokenToken = "id_token token"
}

/**
 * Represents an ImplicitRequest as JSON.
 */
export interface ImplicitRequestJson {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  state?: string;
  extras?: StringMap;
  nonce?: string;
}

/**
 * Generates a cryptographically random new state. Useful for CSRF protection.
 */
const SIZE = 10;  // 10 bytes
const newState = function(crypto: Crypto): string {
  return crypto.generateRandom(SIZE);
};

/**
 * Represents the AuthorizationRequest.
 * For more information look at
 * https://tools.ietf.org/html/rfc6749#section-4.1.1
 */
export class ImplicitRequest {
  static RESPONSE_TYPE_TOKEN = 'token';
  static RESPONSE_TYPE_CODE = 'code';

  // NOTE:
  // Both redirect_uri and state are actually optional.
  // However AppAuth is more opionionated, and requires you to use both.

  clientId: string;
  redirectUri: string;
  scope: string;
  responseType: string;
  state: string;
  nonce: string;
  extras?: StringMap;
  /**
   * Constructs a new ImplicitRequest.
   * Use a `undefined` value for the `state` parameter, to generate a random
   * state for CSRF protection.
   */
  constructor(
      request: ImplicitRequestJson,
      private crypto: Crypto = new DefaultCrypto()) {
    this.clientId = request.client_id;
    this.redirectUri = request.redirect_uri;
    this.scope = request.scope;
    this.responseType = request.response_type || ImplicitResponseType.IdTokenToken;
    this.state = request.state || newState(crypto);
    this.nonce =  newState(crypto);
    this.extras = request.extras;
  }


  /**
   * Serializes the ImplicitRequest to a JavaScript Object.
   */
  toJson(): ImplicitRequestJson {
    return {
        response_type: this.responseType,
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        scope: this.scope,
        state: this.state,
        extras: this.extras,
        nonce: this.nonce
    };
  }
}