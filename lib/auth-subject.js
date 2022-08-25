export class AuthSubject {
    constructor() {
        this.observers = [];
    }
    attach(observer) {
        const observerIndex = this.observers.indexOf(observer);
        if (observerIndex !== -1) {
            return console.log('Subject: Observer has been attached already.');
        }
        this.observers.push(observer);
    }
    detach(observer) {
        const observerIndex = this.observers.indexOf(observer);
        if (observerIndex === -1) {
            return console.log('Subject: Nonexistent observer.');
        }
        this.observers.splice(observerIndex, 1);
    }
    notify(action) {
        for (const observer of this.observers) {
            observer.update(action);
        }
    }
}
