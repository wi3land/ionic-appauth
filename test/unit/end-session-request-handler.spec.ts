import { expect } from 'chai';
import { mock, instance, when, anything } from 'ts-mockito';
import { IonicEndSessionHandler } from '../../src/end-session-request-handler';
import { AuthorizationServiceConfiguration } from '@openid/appauth';
import { Browser, DefaultBrowser } from '../../src/auth-browser';
import { EndSessionRequest } from '../../src/end-session-request';

describe('end Session request handler Tests', () => {
  it(`should do success perform end session request`, async () => {
    const mockedEndSessionRequestClass: EndSessionRequest = mock(EndSessionRequest);
    const mockedEndSessionRequest = instance(mockedEndSessionRequestClass);

    const mockedAuthorizationServiceConfigurationClass: AuthorizationServiceConfiguration = mock(AuthorizationServiceConfiguration);
    const mockedAuthorizationServiceConfiguration = instance(mockedAuthorizationServiceConfigurationClass);

    const mockedBrowserClass: Browser = mock(DefaultBrowser);
    const returnedUrl = 'returnedUrlTest';
    const promiseUrlString: Promise<string> = new Promise((resolve) => {
      resolve(returnedUrl);
    });

    when(mockedBrowserClass.showWindow(anything(), anything())).thenReturn(promiseUrlString);
    const mockedBrowser = instance(mockedBrowserClass);

    const ionicEndSessionHandler: IonicEndSessionHandler = new IonicEndSessionHandler(mockedBrowser);
    const urlResult = await ionicEndSessionHandler.performEndSessionRequest(
      mockedAuthorizationServiceConfiguration,
      mockedEndSessionRequest,
    );
    expect(urlResult).to.equal(returnedUrl);
  });
});
