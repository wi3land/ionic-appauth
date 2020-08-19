import { TokenResponse } from '@openid/appauth';

export enum AuthActions {
    Default = "Default",
    SignInSuccess = "Sign In Success",
    SignInFailed = "Sign In Failed",
    SignOutSuccess = "Sign Out Success",
    SignOutFailed = "Sign Out Failed",
    RefreshSuccess = "Refresh Success",
    RefreshFailed = "Refesh Failed",
    SignInFromStorageSuccess = "Sign In From Storage Success",
    SignInFromStorageFailed = "Sign In From Storage Failed"
}

export interface IAuthAction {
    action : string,
    tokenResponse ?: TokenResponse
    error ?: string;
}

export class AuthActionBuilder {
    public static Default() : IAuthAction{
        return {
            action : AuthActions.Default,
        }
    }

    public static SignOutSuccess() : IAuthAction{
        return {
            action : AuthActions.SignOutSuccess,
        }
    }

    public static SignOutFailed(error : any) : IAuthAction{
        return {
            action : AuthActions.SignOutFailed,
            error : JSON.stringify(error)
        }
    }

    public static RefreshSuccess(token : TokenResponse) : IAuthAction{
        return {
            action : AuthActions.RefreshSuccess,
            tokenResponse : token
        }
    }

    public static RefreshFailed(error : any) : IAuthAction{
        return {
            action : AuthActions.RefreshFailed,
            error : JSON.stringify(error)
        }
    }

    public static SignInSuccess(token : TokenResponse) : IAuthAction{
        return {
            action : AuthActions.SignInSuccess,
            tokenResponse : token
        }
    }

    public static SignInFailed(error : any) : IAuthAction{
        return {
            action : AuthActions.SignInFailed,
            error : JSON.stringify(error)
        }
    }

    public static SignInFromStorageSuccess(token : TokenResponse) : IAuthAction{
        return {
            action : AuthActions.SignInFromStorageSuccess,
            tokenResponse : token
        }
    }

    public static SignInFromStorageFailed(error : any) : IAuthAction{
        return {
            action : AuthActions.SignInFromStorageFailed,
            error : JSON.stringify(error)
        }
    }
}

