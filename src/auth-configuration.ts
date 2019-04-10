import { StringMap } from "@openid/appauth";

export enum AuthenticationType {
    Token = "token",
    AuthorizationCode = "code",
    IdToken = "id_token"
}

export interface IAuthConfig {
    identity_client: string,
    identity_server: string,
    redirect_url: string, 
    end_session_redirect_url: string, 
    scopes: string,
    usePkce : boolean,
    response_type?: string,
    auth_extras?: StringMap
}