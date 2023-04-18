import { __awaiter } from 'tslib';
export class IonicUserInfoHandler {
  constructor(requestor) {
    this.requestor = requestor;
  }
  performUserInfoRequest(configuration, token) {
    return __awaiter(this, void 0, void 0, function* () {
      let settings = {
        url: configuration.userInfoEndpoint,
        dataType: 'json',
        method: 'GET',
        headers: {
          Authorization: `${token.tokenType == 'bearer' ? 'Bearer' : token.tokenType} ${token.accessToken}`,
          'Content-Type': 'application/json',
        },
      };
      return this.requestor.xhr(settings);
    });
  }
}
