import { IAuthAction } from ".";

export class ActionLogger {
    public log(action: IAuthAction) : void {};
}

export class ConsoleActionLogger implements ActionLogger {
    public log(action: IAuthAction) : void {
        console.log(JSON.stringify(action));
    }
}