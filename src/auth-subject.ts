import { IAuthAction } from './auth-action';
import { BaseAuthObserver } from './auth-observer';

export interface IAuthSubject {
    attach(observer: BaseAuthObserver): void;
    detach(observer: BaseAuthObserver): void;
    notify(action : IAuthAction): void;
}

export class AuthSubject implements IAuthSubject {

    private observers: BaseAuthObserver[] = [];

    public attach(observer: BaseAuthObserver): void {
        const observerIndex = this.observers.indexOf(observer);
        if (observerIndex !== -1) {
            return console.log('Subject: Observer has been attached already.');
        }

        this.observers.push(observer);
    }

    public detach(observer: BaseAuthObserver): void {
        const observerIndex = this.observers.indexOf(observer);
        if (observerIndex === -1) {
            return console.log('Subject: Nonexistent observer.');
        }

        this.observers.splice(observerIndex, 1);
    }

    public notify(action : IAuthAction): void {
        for (const observer of this.observers) {
            observer.update(action);
        }
    }
}