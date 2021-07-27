import { Requestor } from "@openid/appauth";
import { XhrSettings } from 'ionic-appauth/lib/cordova';
import axios, { AxiosResponse } from 'axios';

export class  AxiosRequestor extends Requestor  {

    
    public async xhr<T>(settings: XhrSettings){
        const instance = axios.create({
            timeout: 2000,
            headers: settings.headers
        });
    
        if(!settings.method)   
            settings.method = "GET";

        switch(settings.method){
            case "GET":
                return instance.get<T>(settings.url).then((value : AxiosResponse<T>) => value.data);
            case "POST":
                return instance.post<T>(settings.url, settings.data).then((value : AxiosResponse<T>) => value.data);
            case "PUT":
                return instance.put<T>(settings.url, settings.data).then((value : AxiosResponse<T>) => value.data);
            case "DELETE":
                return instance.delete<T>(settings.url).then((value : AxiosResponse<T>) => value.data);
        }
    } 
}