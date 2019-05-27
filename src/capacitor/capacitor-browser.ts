import { Browser } from '../auth-browser';
import { Plugins, BrowserOpenOptions } from '@capacitor/core';

export class CapacitorBrowser extends Browser {
    public closeWindow(): void | Promise<void> {
        if(!Plugins.Browser)
            throw new Error("Capacitor Browser Is Undefined!");
            
        Plugins.Browser.close();
    }


    public async showWindow(url: string, callbackUrl?: string): Promise<string | undefined> {
        let options : BrowserOpenOptions = {
            url : url,
            windowName: '_self'
        };

        if(!Plugins.Browser)
            throw new Error("Capacitor Browser Is Undefined!");
            
        Plugins.Browser.open(options);
         
        return ;
    }    
}
