export declare abstract class Browser {
    protected onCloseFunction: Function;
    abstract showWindow(url: string, callbackUrl?: string): string | undefined | Promise<string | undefined>;
    abstract closeWindow(): void | Promise<void>;
    browserCloseListener(closeBrowserEvent: Function): void;
}
export declare class DefaultBrowser extends Browser {
    showWindow(url: string): string | undefined;
    closeWindow(): void;
}
