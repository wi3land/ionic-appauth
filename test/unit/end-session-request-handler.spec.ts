import { expect } from "chai";
import { mock, instance } from "ts-mockito";
import { IonicEndSessionHandler } from "../../src/end-session-request-handler"
import { AuthorizationServiceConfiguration, } from "@openid/appauth";
import { DefaultBrowser } from "../../src/auth-browser";
import { EndSessionRequest } from "../../src/end-session-request";

describe('end Session request handler Tests', () => {

    it(`should do success perform end session request`, async () => {
     
      const mockedEndSessionRequestClass: EndSessionRequest  = mock(EndSessionRequest);
      const mockedEndSessionRequest = instance(mockedEndSessionRequestClass);

      const mockedAuthorizationServiceConfigurationClass: AuthorizationServiceConfiguration  = mock(AuthorizationServiceConfiguration);
      const mockedAuthorizationServiceConfiguration = instance(mockedAuthorizationServiceConfigurationClass);

      const mockedDefaultBrowserClass: DefaultBrowser  = mock(DefaultBrowser);
      const mockedDefaultBrowser = instance(mockedDefaultBrowserClass);

      const ionicEndSessionHandler: IonicEndSessionHandler = new IonicEndSessionHandler(mockedDefaultBrowser);
      const urlResult = await ionicEndSessionHandler.performEndSessionRequest(mockedAuthorizationServiceConfiguration,mockedEndSessionRequest);
      expect(urlResult).to.equal(null);
    });

});