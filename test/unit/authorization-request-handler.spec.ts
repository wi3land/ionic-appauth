import { expect } from 'chai';
import { mock, instance, when, anything } from 'ts-mockito';
import { IonicAuthorizationRequestHandler, AUTHORIZATION_RESPONSE_KEY } from '../../src/authorization-request-handler';
import { Browser, DefaultBrowser } from '../../src/auth-browser';
import { DefaultCrypto, AuthorizationServiceConfiguration, AuthorizationRequest, AuthorizationRequestJson } from '@openid/appauth';
import { IonicStorage } from '../../src/auth-storage';

let authRequestJson: AuthorizationRequestJson = {
  response_type: 'response_typeTest',
  client_id: 'client_idTest',
  redirect_uri: 'redirect_uriTest',
  scope: 'scopeTest',
  state: 'barTest',
};

async function performIonicRequestHandlerAuthReq(url: string | undefined, mockedCrypto?: DefaultCrypto): Promise<string | null> {
  const mockedBrowserClass: Browser = mock(DefaultBrowser);
  const promiseUrlString: Promise<string | undefined> = new Promise((resolve) => {
    resolve(url);
  });

  when(mockedBrowserClass.showWindow(anything(), anything())).thenReturn(promiseUrlString);
  const mockedBrowser = instance(mockedBrowserClass);

  const mockedAuthorizationServiceConfigurationClass: AuthorizationServiceConfiguration = mock(AuthorizationServiceConfiguration);
  const mockedAuthorizationServiceConfiguration = instance(mockedAuthorizationServiceConfigurationClass);

  const storage: IonicStorage = new IonicStorage();
  let crypto: DefaultCrypto = new DefaultCrypto();
  if (mockedCrypto) {
    crypto = mockedCrypto;
  }
  const ionicAuthorizationRequestHandler: IonicAuthorizationRequestHandler = new IonicAuthorizationRequestHandler(
    mockedBrowser,
    storage,
    undefined,
    crypto,
  );

  await ionicAuthorizationRequestHandler.performAuthorizationRequest(
    mockedAuthorizationServiceConfiguration,
    new AuthorizationRequest(authRequestJson, crypto, false),
  );

  return storage.getItem(AUTHORIZATION_RESPONSE_KEY);
}

async function evaluateReturnedUrl(returnedUrl: string | undefined, mockedCrypto?: DefaultCrypto): Promise<void> {
  const urlResult = await performIonicRequestHandlerAuthReq(returnedUrl, mockedCrypto);
  expect(urlResult).to.be.equal(returnedUrl);
}

describe('auth request handler Tests', () => {
  it(`should do success perform auth request`, async () => {
    const returnedUrl = 'returnedUrlTest?state=barTest#';

    await evaluateReturnedUrl(returnedUrl);
  });

  it(`should do success perform auth request with error string return`, async () => {
    const returnedUrl = 'returnedUrlTest?state=barTest&error=errorTest#';

    await evaluateReturnedUrl(returnedUrl);
  });

  it(`should do success perform auth request with state request error`, async () => {
    const returnedUrl = 'returnedUrlTest?state=stateTest&error=errorTest#';

    await evaluateReturnedUrl(returnedUrl);
  });

  it(`should do error perform auth request for handle not available from crypto`, async () => {
    const returnedUrl = 'returnedErrorUrlTest';

    const mockedCryptoClass: DefaultCrypto = mock(DefaultCrypto);
    const mockedCrypto = instance(mockedCryptoClass);

    await evaluateReturnedUrl(returnedUrl, mockedCrypto);
  });
});
