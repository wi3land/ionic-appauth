import { TokenResponse } from "@openid/appauth";

export interface IAuthSession {
    isAuthenticated : boolean;
    token?: TokenResponse;
    user?: any;
}

export class DefaultAuthSession implements IAuthSession {
    isAuthenticated: boolean = false;    
    token?: TokenResponse | undefined = undefined;
    user?: any = undefined;
}