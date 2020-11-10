export abstract class Browser {
    protected onCloseFunction : Function = () => {};

    abstract showWindow(url : string, callbackUrl?: string) : string | undefined | Promise<string | undefined>;
    abstract closeWindow(): void | Promise<void>;

    browserCloseListener(closeBrowserEvent : Function){
        this.onCloseFunction = closeBrowserEvent;
    }
}

export class DefaultBrowser extends Browser {
    public showWindow(url: string) : string | undefined {
        const openWindow = window.open(url, "_self")
        if (openWindow) {
            openWindow.addEventListener('beforeupload', () => this.onCloseFunction());
        }

        return;
    }

    public closeWindow(): void {
        window.close();
    }
}
