import { IAuthAction, AuthActions } from './auth-action';
import { TokenResponse } from '@openid/appauth';
import { Guid } from "guid-typescript";
import { DefaultAuthSession, IAuthSession } from './auth-session';

export abstract class BaseAuthObserver {
    protected id : Guid = Guid.create();
    abstract update(action: IAuthAction): void;
}

export class AuthObserver extends BaseAuthObserver {

    constructor(private func: (action : IAuthAction) => void) {
        super();
    }

    update(action: IAuthAction): void {
        this.func(action);
    }

    static Create(func: (action : IAuthAction) => void) : AuthObserver{
        return new AuthObserver(func);
    }
}

export class TokenObserver extends BaseAuthObserver {
    public token?: TokenResponse;

    update(action: IAuthAction): void {
        this.token = action.tokenResponse;
    }
}

export class ActionHistoryObserver extends BaseAuthObserver {
    public history: IAuthAction[] = [];
    public lastAction?: IAuthAction;

    update(action: IAuthAction): void {
        this.lastAction = action;
        this.history.push(action);
    }

    clear(): void {
        this.history = [];
        this.lastAction = undefined;
    }
}

export class SessionObserver extends BaseAuthObserver {
    public session: IAuthSession = new DefaultAuthSession();

    update(action: IAuthAction): void {
        switch(action.action) {
            case AuthActions.SignInFailed:
            case AuthActions.RefreshFailed:
            case AuthActions.LoadTokenFromStorageFailed:
                this.session.error = action.error;
                this.session.token = undefined;
                this.session.user = undefined;
                this.session.isAuthenticated = false;
                break;
            case AuthActions.SignInSuccess:
            case AuthActions.RefreshSuccess:
            case AuthActions.LoadTokenFromStorageSuccess:
                this.session.error = undefined;
                this.session.token = action.tokenResponse;
                this.session.isAuthenticated = true;
                break;
            case AuthActions.LoadUserInfoSuccess:
                this.session.error = undefined;
                this.session.user = action.user;
                break; 
            case AuthActions.LoadUserInfoFailed:
                this.session.error = action.error;
                this.session.user = undefined;
                break; 
            case AuthActions.SignOutSuccess:
            case AuthActions.Init:
                this.session = new DefaultAuthSession();
                break;
            case AuthActions.SignOutFailed:
                this.session.error = action.error;
                break;
        }
    }
}

export class ConsoleLogObserver extends BaseAuthObserver {
    update(action: IAuthAction): void {
        console.log(action);
    }
}