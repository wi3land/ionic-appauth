import { expect } from 'chai';
import { mock, when, instance, anything } from 'ts-mockito';
import { AuthorizationServiceConfiguration, TokenResponse, JQueryRequestor } from '@openid/appauth';
import { IonicUserInfoHandler } from '../../src/user-info-request-handler';

describe('user Info Request handler Tests', () => {
  it(`should do success request with user info`, async () => {
    const mockedRequestorClass: JQueryRequestor = mock(JQueryRequestor);
    const userInfo = {
      name: 'nameTest',
      family_name: 'familyNameTest',
      given_name: 'givenNameTest',
      sub: 'subTest',
      subname: 'subnameTest',
    };
    const promiseResult = new Promise((resolve) => {
      resolve(userInfo);
    });
    when(mockedRequestorClass.xhr(anything())).thenReturn(promiseResult);
    const mockedRequestor = instance(mockedRequestorClass);

    const userInfoHandler: IonicUserInfoHandler = new IonicUserInfoHandler(mockedRequestor);
    const token = new TokenResponse({
      access_token: 'accessToken',
      token_type: 'bearer',
      expires_in: '1000',
      refresh_token: undefined,
      scope: undefined,
      id_token: 'idToken',
      issued_at: 1,
    });

    const configuration = new AuthorizationServiceConfiguration({
      authorization_endpoint: 'authorization://endpoint',
      token_endpoint: 'token://endpoint',
      revocation_endpoint: 'revocation://endpoint',
      userinfo_endpoint: 'userInfo://endpoint',
      end_session_endpoint: 'endSession://endpoint',
    });

    const userInfoReturned = await userInfoHandler.performUserInfoRequest(configuration, token);
    expect(userInfoReturned).to.equal(userInfo);
  });
});
