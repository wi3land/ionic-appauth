import { IAuthAction } from './auth-action';
import { BaseAuthObserver } from './auth-observer';
export interface IAuthSubject {
    attach(observer: BaseAuthObserver): void;
    detach(observer: BaseAuthObserver): void;
    notify(action: IAuthAction): void;
}
export declare class AuthSubject implements IAuthSubject {
    private observers;
    attach(observer: BaseAuthObserver): void;
    detach(observer: BaseAuthObserver): void;
    notify(action: IAuthAction): void;
}
