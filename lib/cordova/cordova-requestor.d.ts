import { Requestor } from '@openid/appauth';
export interface XhrSettings {
    url: string;
    dataType?: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    data?: any;
    headers?: any;
}
export declare class CordovaRequestor extends Requestor {
    constructor();
    xhr<T>(settings: XhrSettings): Promise<T>;
    private get;
    private post;
    private put;
    private delete;
}
