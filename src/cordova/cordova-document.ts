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