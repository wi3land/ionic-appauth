import { Browser } from '../auth-browser';
export declare class CordovaBrowser extends Browser {
    private inAppBrowserRef;
    closeWindow(): Promise<void>;
    showWindow(url: string): Promise<string | undefined>;
}
