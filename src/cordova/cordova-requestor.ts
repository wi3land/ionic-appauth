import { CordovaDocument } from './cordova-document';
import { Requestor } from '@openid/appauth';
import { HTTP, HTTPResponse } from '@ionic-native/http'

export interface XhrSettings {
    url: string,
    dataType?: string,
    method?: "GET" | "POST" | "PUT" | "DELETE",
    data?: any,
    headers?: any// {key : string, value: any}
}

// REQUIRES CORDOVA PLUGINS
// cordova-plugin-advanced-http
export class CordovaRequestor extends Requestor {

    constructor(){
        CordovaDocument.ready(() => HTTP.setDataSerializer('utf8'));
        super();
    }

    public async xhr<T>(settings: XhrSettings) : Promise<T> {
        if(!settings.method)   
            settings.method = "GET";

        await CordovaDocument.ready();

        switch(settings.method){
            case "GET":
                return this.get(settings.url, settings.headers);
            case "POST":
                return this.post(settings.url, settings.data, settings.headers);
            case "PUT":
                return this.put(settings.url, settings.data, settings.headers);
            case "DELETE":
                return this.delete(settings.url, settings.headers);
        }
    }

    private async get<T>(url : string, headers: any) {
        return HTTP.get(url, undefined, headers).then((response: HTTPResponse) => JSON.parse(response.data) as T);
    }

    private async post<T>(url : string, data: any, headers: any){
        return HTTP.post(url, data, headers).then((response: HTTPResponse) => JSON.parse(response.data) as T);
    }

    private async put<T>(url : string, data: any, headers: any){
        return HTTP.put(url, data, headers).then((response: HTTPResponse) => JSON.parse(response.data) as T);
    }

    private async delete<T>(url : string, headers: any){
        return HTTP.delete(url,undefined,headers).then((response: HTTPResponse) => JSON.parse(response.data) as T);
    }
}