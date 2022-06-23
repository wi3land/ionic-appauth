export enum AuthenticationType {
    Token = "token",
    AuthorizationCode = "code",
    IdToken = "id_token"
}

export interface IAuthConfig {
    client_id: string,
    client_secret?: string,
    server_host: string,
    redirect_url: string, 
    end_session_redirect_url: string,
    token_response_storage_key?: string;
    scopes: string,
    pkce : boolean
}