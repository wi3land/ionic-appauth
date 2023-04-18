import { DefaultCrypto } from '@openid/appauth/built/crypto_utils';
const BYTES_LENGTH = 10;
const newState = function (crypto) {
  return crypto.generateRandom(BYTES_LENGTH);
};
export class EndSessionRequest {
  constructor(request, crypto = new DefaultCrypto()) {
    this.state = request.state || newState(crypto);
    this.idTokenHint = request.idTokenHint;
    this.postLogoutRedirectURI = request.postLogoutRedirectURI;
  }
  toJson() {
    let json = {
      idTokenHint: this.idTokenHint,
      postLogoutRedirectURI: this.postLogoutRedirectURI,
    };
    if (this.state) {
      json['state'] = this.state;
    }
    return json;
  }
}
