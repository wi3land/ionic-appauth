import { TokenResponse } from '@openid/appauth';
export interface IAuthSession {
  isAuthenticated: boolean;
  token?: TokenResponse;
  user?: any;
  error?: string;
}
export declare class DefaultAuthSession implements IAuthSession {
  isAuthenticated: boolean;
  token?: TokenResponse;
  user?: any;
  error?: string;
}
