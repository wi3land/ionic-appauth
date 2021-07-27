import { Browser } from '../auth-browser';
import { Browser as CapBrowser, OpenOptions } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

export class CapacitorBrowser extends Browser {
    public closeWindow(): void | Promise<void> {
        if(!CapBrowser)
            throw new Error("Capacitor Browser Is Undefined!");
            
        if(Capacitor.getPlatform() !== 'android'){
            CapBrowser.close();
        }       
    }

    public async showWindow(url: string): Promise<string | undefined> {
        let options : OpenOptions = {
            url : url,
            windowName: '_self'
        };

        if(!CapBrowser)
            throw new Error("Capacitor Browser Is Undefined!");
            
        CapBrowser.addListener("browserFinished", () => {
            this.onCloseFunction();
        });

        CapBrowser.open(options);
         
        return ;
    } 
}
