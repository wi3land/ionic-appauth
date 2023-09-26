import { IAuthAction } from './auth-action';
import { TokenResponse } from '@openid/appauth';
import { IAuthSession } from './auth-session';
export declare abstract class BaseAuthObserver {
  protected id: string;
  abstract update(action: IAuthAction): void;
}
export declare class AuthObserver extends BaseAuthObserver {
  private func;
  constructor(func: (action: IAuthAction) => void);
  update(action: IAuthAction): void;
  static Create(func: (action: IAuthAction) => void): AuthObserver;
}
export declare class TokenObserver extends BaseAuthObserver {
  token?: TokenResponse;
  update(action: IAuthAction): void;
}
export declare class ActionHistoryObserver extends BaseAuthObserver {
  history: IAuthAction[];
  lastAction?: IAuthAction;
  update(action: IAuthAction): void;
  clear(): void;
}
export declare class SessionObserver extends BaseAuthObserver {
  session: IAuthSession;
  update(action: IAuthAction): void;
}
export declare class ConsoleLogObserver extends BaseAuthObserver {
  update(action: IAuthAction): void;
}
