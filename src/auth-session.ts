import { TokenResponse } from "@openid/appauth";

export interface IAuthSession {
    isAuthenticated : boolean;
    token?: TokenResponse;
    user?: any;

    onSignInSuccessful() : void;
    onSignOutSuccessful() : void;
    onRefreshSuccessful() : void;
    onSignInFailure() : void;
    onSignOutFailure() : void;
    onRefreshFailure() : void;
}

export class DefaultAuthSession implements IAuthSession {
    isAuthenticated: boolean = false;    
    token?: TokenResponse | undefined = undefined;
    user?: any = undefined;

    onSignInSuccessful(): void {
    }
    onSignOutSuccessful(): void {
    }
    onRefreshSuccessful(): void {
    }
    onSignInFailure(): void {
    }
    onSignOutFailure(): void {
    }
    onRefreshFailure(): void {
    }
}