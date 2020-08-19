import { IAuthAction } from './auth-action';

export interface IAuthSubject {
    attach(observer: IAuthObserver): void;
    detach(observer: IAuthObserver): void;
    notify(action : IAuthAction): void;
}

export class AuthSubject implements IAuthSubject {

    private observers: IAuthObserver[] = [];

    public attach(observer: IAuthObserver): void {
        const observerIndex = this.observers.indexOf(observer);
        if (observerIndex !== -1) {
            return console.log('Subject: Observer has been attached already.');
        }

        this.observers.push(observer);
    }

    public detach(observer: IAuthObserver): void {
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

export interface IAuthObserver {
    update(action : IAuthAction): void;
}

export class AuthObserver implements IAuthObserver {

    constructor(
        private func : (action: IAuthAction) => void
        ) {}

    update(action: IAuthAction): void {
        this.func(action);
    }

}