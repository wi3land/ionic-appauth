import { Crypto, DefaultCrypto } from '@openid/appauth/built/crypto_utils';

export interface EndSessionRequestJson {
  idTokenHint: string;
  postLogoutRedirectURI: string;
  state?: string;
}

const BYTES_LENGTH = 10;
const newState = function(crypto: Crypto): string {
    return crypto.generateRandom(BYTES_LENGTH);
  };
  

export class EndSessionRequest {

  state: string;
  idTokenHint: string;
  postLogoutRedirectURI: string;

  constructor(
    request: EndSessionRequestJson,
    crypto : Crypto = new DefaultCrypto()) {
      this.state = request.state || newState(crypto);
      this.idTokenHint = request.idTokenHint;
      this.postLogoutRedirectURI = request.postLogoutRedirectURI;
    }

  toJson(): EndSessionRequestJson {
    let json: EndSessionRequestJson = {idTokenHint: this.idTokenHint, postLogoutRedirectURI : this.postLogoutRedirectURI };

    if (this.state) {
      json['state'] = this.state;
    }

    return json;
  }

}