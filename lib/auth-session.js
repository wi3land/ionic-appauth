export class DefaultAuthSession {
    constructor() {
        this.isAuthenticated = false;
        this.token = undefined;
        this.user = undefined;
        this.error = undefined;
    }
}
