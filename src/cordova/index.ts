export * from './cordova-browser';
export * from './cordova-secure-storage';
export * from './cordova-requestor';

export class CordovaDocument {
    
    public static ready(f ?: Function) : Promise<void>{
        return new Promise(resolve => {
            document.addEventListener('deviceready', () => {
                if(f != undefined){
                    f();
                }
                resolve();
            });
        })
    }
}