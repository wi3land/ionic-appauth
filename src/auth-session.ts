import { TokenResponse } from "@openid/appauth";

export interface IAuthSession {
    isAuthenticated : boolean;
    token?: TokenResponse;
    user?: any;
    error?: string;
}

export class DefaultAuthSession implements IAuthSession {
    isAuthenticated: boolean = false;    
    token?: TokenResponse = undefined;
    user?: any = undefined;
    error?: string = undefined;
}