import { StringMap } from "@openid/appauth";

export interface IAuthConfig {
    identity_client: string,
    identity_server: string,
    redirect_url: string, 
    end_session_redirect_url: string, 
    scopes: string,
    usePkce : boolean,
    auth_extras?: StringMap
}