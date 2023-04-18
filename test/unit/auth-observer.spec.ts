import { expect } from 'chai';
import { SessionObserver, TokenObserver, ConsoleLogObserver } from '../../src/auth-observer';
import { AuthActions, IAuthAction, AuthActionBuilder } from '../../src/auth-action';

describe('auth observer Tests', () => {
  it(`should do success creating Session Observer and simulate SignOutFailed`, async () => {
    const observer: SessionObserver = new SessionObserver();
    const action: IAuthAction = AuthActionBuilder.SignOutFailed('error');
    expect(action.action).to.be.equal(AuthActions.SignOutFailed);
    observer.update(action);
  });

  it(`should do success creating Token Observer`, async () => {
    const observer: TokenObserver = new TokenObserver();
    const action: IAuthAction = {
      action: AuthActions.SignInFailed,
    };
    observer.update(action);
  });

  it(`should do success creating Console Log Observer`, async () => {
    const observer: ConsoleLogObserver = new ConsoleLogObserver();
    observer.update({
      action: AuthActions.RefreshFailed,
    });
  });
});
