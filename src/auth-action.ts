import { TokenResponse } from '@openid/appauth';

export enum AuthActions {
    Default = "Default",
    SignInSuccess = "Sign In Success",
    SignInFailed = "Sign In Failed",
    SignOutSuccess = "Sign Out Success",
    SignOutFailed = "Sign Out Failed",
    RefreshSuccess = "Refresh Success",
    RefreshFailed = "Refesh Failed",
    LoadTokenFromStorageSuccess = "Get Token From Storage Success",
    LoadTokenFromStorageFailed = "Get Token From Storage Failed",
    LoadUserInfoSuccess = "Load User Info Success",
    LoadUserInfoFailed = "Load User Info Failed",
}

export interface IAuthAction {
    action : string,
    tokenResponse ?: TokenResponse
    error ?: string;
    user ?: any;
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
            error: error.message
        }
    }

    public static RefreshSuccess(tokenResponse : TokenResponse) : IAuthAction{
        return {
            action : AuthActions.RefreshSuccess,
            tokenResponse
        }
    }

    public static RefreshFailed(error : any) : IAuthAction{
        return {
            action : AuthActions.RefreshFailed,
            error: error.message,
        }
    }

    public static SignInSuccess(tokenResponse : TokenResponse) : IAuthAction{
        return {
            action : AuthActions.SignInSuccess,
            tokenResponse
        }
    }

    public static SignInFailed(error : any) : IAuthAction {
        return {
            action : AuthActions.SignInFailed,
            error: error.message
        }
    }

    public static LoadTokenFromStorageSuccess(tokenResponse : TokenResponse) : IAuthAction{
        return {
            action : AuthActions.LoadTokenFromStorageSuccess,
            tokenResponse
        }
    }

    public static LoadTokenFromStorageFailed(error : any) : IAuthAction{
        return {
            action : AuthActions.LoadTokenFromStorageFailed,
            error: error.message
        }
    }

    public static LoadUserInfoSuccess(user : any) : IAuthAction{
        return {
            action : AuthActions.LoadUserInfoSuccess,
            user
        }
    }

    public static LoadUserInfoFailed(error : any) : IAuthAction{
        return {
            action : AuthActions.LoadUserInfoFailed,
            error: error.message
        }
    }
}

