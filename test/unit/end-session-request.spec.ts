import { expect } from 'chai';
import { when } from 'ts-mockito';
import { EndSessionRequest, EndSessionRequestJson } from '../../src/end-session-request';

describe('end Session Request Tests', () => {
  it(`should construct end session request object with request state`, async () => {
    const request: EndSessionRequestJson = {
      idTokenHint: 'idTokenHintTest',
      postLogoutRedirectURI: 'postLogoutRedirectURITest',
      state: 'stateTest',
    };

    const endSessionRequest: EndSessionRequest = new EndSessionRequest(request);
    expect(JSON.stringify(endSessionRequest.toJson())).to.equal(JSON.stringify(request));
  });

  it(`should construct end session request object without request state`, async () => {
    const request: EndSessionRequestJson = {
      idTokenHint: 'idTokenHintTest',
      postLogoutRedirectURI: 'postLogoutRedirectURITest',
    };

    const endSessionRequest: EndSessionRequest = new EndSessionRequest(request);
    expect(endSessionRequest.toJson().idTokenHint).to.equal(request.idTokenHint);
    expect(endSessionRequest.toJson().postLogoutRedirectURI).to.equal(request.postLogoutRedirectURI);
    expect(endSessionRequest.toJson().postLogoutRedirectURI).to.be.not.undefined;
  });
});
