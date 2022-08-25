import { Browser } from '../auth-browser';
export declare class CapacitorBrowser extends Browser {
    closeWindow(): void | Promise<void>;
    showWindow(url: string): Promise<string | undefined>;
}
