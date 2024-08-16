//! Authentication functionality.
use crate::auth::extensions::{
    CorrelationVectorReqwestBuilder, JsonExDeserializeMiddleware, LoggingReqwestRequestHandler,
    LoggingReqwestResponseHandler, SigningReqwestBuilder,
};
use crate::auth::models::AccessTokenPrefix;
use crate::auth::request_signer::RequestSigner;

use crate::auth::models::request::{
    XADProperties, XASTProperties, XASUProperties, XSTSProperties, XTokenRequest,
};

use crate::auth::error::Error;
use crate::auth::models::{request, response, DeviceType, XalAppParameters, XalClientParameters};
use crate::auth::request_signer;

use oauth2::reqwest::async_http_client;
use oauth2::{
    basic::{BasicClient, BasicErrorResponseType},
    AuthType, AuthUrl, AuthorizationCode, Client as OAuthClient, ClientId, ClientSecret, CsrfToken,
    DeviceAuthorizationUrl, PkceCodeChallenge, PkceCodeVerifier, RefreshToken, RequestTokenError,
    Scope, StandardDeviceAuthorizationResponse, StandardErrorResponse, TokenResponse, TokenUrl,
};
use oauth2::{EndUserVerificationUrl, UserCode, VerificationUriComplete};
use serde_json::json;
use std::collections::HashMap;
use url::{form_urlencoded, Url};

/// Authentication related constants
pub struct Constants;

impl Constants {
    /// Redirect URL for implicit / authorization code flow
    // pub const OAUTH20_DESKTOP_REDIRECT_URL: &'static str =
    //     "https://login.live.com/oauth20_desktop.srf";
    pub const OAUTH20_DESKTOP_REDIRECT_URL: &'static str =
        "ms-xal-public-beta-000000004c20a908://auth";
    /// live.com Authorization URL
    pub const OAUTH20_AUTHORIZE_URL: &'static str = "https://login.live.com/oauth20_authorize.srf";
    /// live.com Device Authorization URL (Device Code flow)
    pub const OAUTH20_DEVICE_AUTHORIZE_URL: &'static str =
        "https://login.live.com/oauth20_connect.srf";
    /// live.com Remote Device Authorization URL (Device Code flow) - to assemble device authorization URL incl. OTC
    pub const OAUTH20_DEVICE_REMOTEAUTHORIZE_URL: &'static str =
        "https://login.live.com/oauth20_remoteconnect.srf";
    /// live.com Token URL
    pub const OAUTH20_TOKEN_URL: &'static str = "https://login.live.com/oauth20_token.srf";

    /// live.com authentication finish URL
    /// Called f.e. on end of device code flow
    pub const OAUTH20_FINISH_FLOW_URL: &'static str = "https://login.live.com/ppsecure/post.srf";

    /// Xbox Title endpoints URL, returns signing policies for supported domains/endpoints
    pub const XBOX_TITLE_ENDPOINTS_URL: &'static str =
        "https://title.mgt.xboxlive.com/titles/default/endpoints";

    /// Xbox Sisu authentication endpoint
    pub const XBOX_SISU_AUTHENTICATE_URL: &'static str = "https://sisu.xboxlive.com/authenticate";
    /// Xbox Sisu authorization endpoint
    pub const XBOX_SISU_AUTHORIZE_URL: &'static str = "https://sisu.xboxlive.com/authorize";

    /// Xbox Device Authentication endpoint (XASD token)
    pub const XBOX_DEVICE_AUTH_URL: &'static str =
        "https://device.auth.xboxlive.com/device/authenticate";
    /// Xbox Title Authentication endpoint (XAST token)
    pub const XBOX_TITLE_AUTH_URL: &'static str =
        "https://title.auth.xboxlive.com/title/authenticate";
    /// Xbox User Authentication endpoint (XASU token)
    pub const XBOX_USER_AUTH_URL: &'static str = "https://user.auth.xboxlive.com/user/authenticate";
    /// Xbox Service Authorization endpoint (XSTS token)
    pub const XBOX_XSTS_AUTH_URL: &'static str = "https://xsts.auth.xboxlive.com/xsts/authorize";

    /// Default Xbox Live authorization scope
    pub const SCOPE_SERVICE_USER_AUTH: &'static str = "service::user.auth.xboxlive.com::MBI_SSL";
    /// Signin Xbox Live authorization scope (used for custom Azure apps)
    pub const SCOPE_XBL_SIGNIN: &'static str = "Xboxlive.signin";
    /// Offline access Xbox Live authorization scope (used for custom Azure apps)
    pub const SCOPE_XBL_OFFLINE_ACCESS: &'static str = "Xboxlive.offline_access";

    /// Relying Party Auth Xbox Live
    pub const RELYING_PARTY_AUTH_XBOXLIVE: &'static str = "http://auth.xboxlive.com";
    /// Relying Party Xbox Live
    pub const RELYING_PARTY_XBOXLIVE: &'static str = "http://xboxlive.com";
}

/// XAL Authenticator
#[derive(Debug)]
pub struct XalAuthenticator {
    /// Random device id
    device_id: uuid::Uuid,
    /// Application parameters
    ///
    /// See constants in [`crate::models::app_params]
    app_params: XalAppParameters,
    /// Client parameters
    ///
    /// See constants in [`crate::models::client_params]
    client_params: XalClientParameters,
    /// Correlation vector
    ms_cv: cvlib::CorrelationVector,
    /// HTTP client instance
    client: reqwest::Client,
    /// HTTP request signer
    request_signer: request_signer::RequestSigner,
    /// Xbox Live Sandbox Id, "RETAIL" is commonly used
    sandbox_id: String,
}

impl Default for XalAuthenticator {
    fn default() -> Self {
        Self::new(
            XalAppParameters::default(),
            XalClientParameters::default(),
            "RETAIL".to_string(),
        )
    }
}

/// Static methods
impl XalAuthenticator {
    /// Generate OAuth2 random state
    ///
    /// Examples
    ///
    /// ```
    /// # use xal::XalAuthenticator;
    /// let state = XalAuthenticator::generate_random_state();
    /// ```
    pub fn generate_random_state() -> CsrfToken {
        CsrfToken::new_random()
    }

    /// Generate OAuth2 code verifier
    ///
    /// # Examples
    ///
    /// ```
    /// # use xal::XalAuthenticator;
    /// let (pkce_challenge, pkce_verifier) = XalAuthenticator::generate_code_verifier();
    /// ```
    pub fn generate_code_verifier() -> (PkceCodeChallenge, PkceCodeVerifier) {
        PkceCodeChallenge::new_random_sha256()
    }

    /// Obtain an alternative URL for the device code verification process
    ///
    /// This method generates a URL with the device code already prefilled.
    /// Users only need to visit this URL and authenticate their account without copying and pasting the code.
    ///
    /// # Arguments
    ///
    /// * `user_code` - The user code generated during the device code flow initialization.
    ///
    /// # Returns
    ///
    /// * `VerificationUriComplete` - A URL with the device code already prefilled.
    ///
    /// # Examples
    ///
    /// ```
    /// use xal::XalAuthenticator;
    /// use xal::oauth2::UserCode;
    ///
    /// let user_code = UserCode::new("abc123".to_string());
    /// let verification_uri = XalAuthenticator::get_device_code_verification_uri(&user_code);
    /// println!("{:?}", verification_uri);
    /// ```
    pub fn get_device_code_verification_uri(user_code: &UserCode) -> VerificationUriComplete {
        VerificationUriComplete::new(format!(
            "{}?lc=1033&otc={}",
            Constants::OAUTH20_DEVICE_REMOTEAUTHORIZE_URL,
            user_code.secret()
        ))
    }

    /// Parse OAuth2 authorization response by providing the full redirect url containing a code= query parameter
    ///
    /// # Arguments
    ///
    /// * `redirect_url` - The full url of the redirect endpoint containing the code= query parameter.
    /// * `expected_state` - (Optional) The expected state that should match the state returned by the server.
    ///                      If the states do not match, an error will be returned.
    ///
    /// # Returns
    ///
    /// * `Ok(AuthorizationCode)` - On successful validation of the server response and retrieval of the authorization code.
    /// * `Err(Error)` - If there is an error while parsing the server response or if the states do not match.
    ///
    /// # Errors
    ///
    /// * `Error::GeneralError` - If there is a problem with the response url.
    /// * `Error::OAuthExecutionError` - If there is an error with the server response or if the authorization code is not present.
    ///
    /// # Examples
    ///
    /// ```
    /// use xal::{
    ///     XalAuthenticator, url::Url,
    ///     oauth2::CsrfToken,
    /// };
    /// let url = Url::parse("https://example.com/?code=123&state=ABC").unwrap();
    /// let code = XalAuthenticator::parse_authorization_code_response(
    ///     &url,
    ///     Some(&CsrfToken::new("ABC".into())),
    /// ).unwrap();
    ///
    /// assert_eq!(code.secret(), "123");
    /// ```
    pub fn parse_authorization_code_response(
        redirect_url: &Url,
        expected_state: Option<&CsrfToken>,
    ) -> Result<AuthorizationCode, Error> {
        let query_map: HashMap<String, String> = redirect_url
            .query_pairs()
            .map(|(k, v)| (k.to_string(), v.to_string()))
            .collect();

        if let Some(state) = expected_state {
            if let Some(state_resp) = query_map.get("state") {
                if state.secret() != state_resp {
                    return Err(Error::GeneralError(format!(
                        "Invalid state, Expected: {}, Got: {}",
                        state.secret(),
                        state_resp
                    )));
                }
            } else {
                return Err(Error::GeneralError(
                    "Expected 'state' in redirect response".into(),
                ));
            }
        }

        if let Some(error) = query_map.get("error") {
            let error_resp: StandardErrorResponse<BasicErrorResponseType> =
                serde_json::from_value(serde_json::json!({
                    "error": error,
                    "error_description": query_map.get("error_description").map(|x| x.to_string()),
                    "error_uri": query_map.get("error_uri").map(|x| x.to_string()),
                }))
                .map_err(Error::JsonError)?;

            return Err(Error::OAuthExecutionError(
                oauth2::RequestTokenError::ServerResponse(error_resp),
            ));
        } else if let Some(code) = query_map.get("code") {
            return Ok(AuthorizationCode::new(code.to_owned()));
        }

        Err(Error::GeneralError(
            "Response neither had 'code' nor 'error' field".into(),
        ))
    }

    /// Parse OAuth2 implicit grant response
    ///
    /// This method takes a URL with an OAuth2 implicit grant response and optionally a CSRF token.
    /// It parses the response, verifies the CSRF token if provided, and returns the access token.
    ///
    /// # Arguments
    ///
    /// * `url` - The URL containing the OAuth2 implicit grant response.
    /// * `expected_state` - Optionally, a CSRF token to verify against.
    ///
    /// # Returns
    ///
    /// * `Result<response::WindowsLiveTokens, Error>` - The access token and token type.
    ///
    /// # Examples
    ///
    /// ```
    /// use xal::XalAuthenticator;
    /// use xal::oauth2::{CsrfToken, TokenResponse};
    /// use xal::url::Url;
    ///
    /// let url = Url::parse(
    ///     "https://example.com/callback#access_token=token123&token_type=Bearer&expires_in=3600&state=123abc"
    /// )
    /// .unwrap();
    ///
    /// let live_tokens = XalAuthenticator::parse_implicit_grant_url(
    ///     &url,
    ///     Some(&CsrfToken::new("123abc".into()))
    /// ).unwrap();
    ///
    /// assert_eq!(live_tokens.access_token().secret(), "token123");
    /// ```
    pub fn parse_implicit_grant_url(
        url: &Url,
        expected_state: Option<&CsrfToken>,
    ) -> Result<response::WindowsLiveTokens, Error> {
        let fragment = url
            .fragment()
            .ok_or(Error::InvalidRedirectUrl("No fragment found".to_string()))?;

        let mut kv_pairs: HashMap<String, serde_json::Value> = HashMap::new();
        let mut state_resp = None;

        for (k, v) in form_urlencoded::parse(fragment.as_bytes()) {
            match k.as_ref() {
                "expires_in" => {
                    kv_pairs.insert(k.to_string(), json!(v.parse::<u64>().unwrap()));
                }
                "state" => {
                    state_resp = Some(v.to_string());
                    kv_pairs.insert(k.to_string(), json!(v.to_string()));
                }
                _ => {
                    kv_pairs.insert(k.to_string(), json!(v.to_string()));
                }
            }
        }

        if let Some(state) = expected_state {
            if let Some(s) = state_resp {
                if state.secret() != &s.to_string() {
                    return Err(Error::GeneralError(format!(
                        "Invalid state, Expected: {}, Got: {s}",
                        state.secret()
                    )));
                }
            } else {
                return Err(Error::InvalidRedirectUrl("No state found".to_string()));
            }
        }

        Ok(serde_json::from_value(json!(kv_pairs))?)
    }
}

/// OAuth2 request functionality
impl XalAuthenticator {
    /// Create a new instance of the XAL Authenticator
    ///
    /// This method initializes an instance of the XAL Authenticator with the specified
    /// `app_params`, `client_params`, and `sandbox_id`.
    ///
    /// The `device_id` parameter can be provided to use a specific device ID, or it can be left as
    /// `None` to generate a new device ID.
    ///
    /// See constants in [`crate::models::app_params`] for [`crate::XalAppParameters`] and
    /// [`crate::models::client_params`] for [`crate::XalClientParameters`].
    ///
    /// # Examples
    ///
    /// Instantiate explicitly with app/client parameters
    ///
    /// ```
    /// use xal::{XalAuthenticator, app_params, client_params};
    /// let authenticator = XalAuthenticator::new(
    ///     app_params::APP_GAMEPASS_BETA(),
    ///     client_params::CLIENT_ANDROID(),
    ///     "RETAIL".into(),
    /// );
    /// ```
    ///
    /// # Notes
    ///
    /// If you don't have specific needs for client parameters, use [`crate::XalAuthenticator::default`]
    pub fn new(
        app_params: XalAppParameters,
        client_params: XalClientParameters,
        sandbox_id: String,
    ) -> Self {
        Self {
            app_params,
            client_params,
            device_id: uuid::Uuid::new_v4(),
            ms_cv: cvlib::CorrelationVector::new(),
            client: reqwest::Client::new(),
            request_signer: request_signer::RequestSigner::default(),
            sandbox_id: sandbox_id.to_owned(),
        }
    }

    /// Get Device Id
    pub fn device_id(&self) -> uuid::Uuid {
        self.device_id
    }

    /// Get configured sandbox id
    pub fn sandbox_id(&self) -> String {
        self.sandbox_id.clone()
    }

    /// Get active app parameters
    pub fn app_params(&self) -> XalAppParameters {
        self.app_params.clone()
    }

    /// Get active client parameters
    pub fn client_params(&self) -> XalClientParameters {
        self.client_params.clone()
    }

    /// Get request signer instance
    pub fn request_signer(&self) -> RequestSigner {
        self.request_signer.clone()
    }

    /// Get redirection Url
    pub fn get_redirect_uri(&self) -> Option<Url> {
        self.app_params
            .redirect_uri
            .clone()
            .map(|url| Url::parse(&url).unwrap())
    }

    /// Create an internal [`oauth2::Client`]
    ///
    /// Refer to [`oauth2`] crate for it's usage
    pub fn oauth_client(&self) -> Result<BasicClient, Error> {
        let client = OAuthClient::new(
            ClientId::new(self.app_params.client_id.to_string()),
            self.app_params.client_secret.clone().map(ClientSecret::new),
            AuthUrl::new(Constants::OAUTH20_AUTHORIZE_URL.to_string())?,
            Some(TokenUrl::new(Constants::OAUTH20_TOKEN_URL.to_string())?),
        )
        .set_auth_type(AuthType::RequestBody)
        .set_device_authorization_url(DeviceAuthorizationUrl::new(
            Constants::OAUTH20_DEVICE_AUTHORIZE_URL.to_string(),
        )?);

        Ok(client)
    }

    /// Gets the authorization URL for the OAuth2 authentication flow.
    ///
    /// When the user clicks the link in the URL, they will be prompted to sign in with their Xbox Live account.
    ///
    /// Defining a `redirect_url` in [`crate::XalAppParameters`] is mandatory
    /// for this authentication flow
    ///
    /// # Examples
    ///
    /// ```
    /// use xal::{XalAuthenticator, XalAppParameters, client_params};
    /// use xal::oauth2::{RedirectUrl, Scope};
    ///
    /// # async fn demo_code() {
    /// let mut authenticator = XalAuthenticator::new(
    ///     XalAppParameters {
    ///         client_id: "388ea51c-0b25-4029-aae2-17df49d23905".into(),
    ///         title_id: None,
    ///         auth_scopes: vec![
    ///             Scope::new("Xboxlive.signin".into()),
    ///             Scope::new("Xboxlive.offline_access".into())
    ///         ],
    ///         redirect_uri: Some(RedirectUrl::new("https://login.live.com/oauth20_desktop.srf".into()).unwrap()),
    ///         client_secret: None,
    ///     },
    ///     client_params::CLIENT_ANDROID(),
    ///     "RETAIL".into()
    /// );
    ///
    /// let (url, state) = authenticator.get_authorization_url(false)
    ///     .unwrap();
    ///
    /// assert!(url.as_str().starts_with("https://login.live.com/oauth20_desktop.srf"));
    /// # }
    /// ```
    pub fn get_authorization_url(
        &mut self,
        implicit_flow: bool,
    ) -> Result<(EndUserVerificationUrl, CsrfToken), Error> {
        let client =
            self.oauth_client()?
                .set_redirect_uri(self.app_params.redirect_uri.clone().ok_or(
                    Error::InvalidRedirectUrl("Redirect URL was not provided".into()),
                )?);

        let mut req = client
            .authorize_url(Self::generate_random_state)
            .add_scopes(self.app_params.auth_scopes.clone());

        if implicit_flow {
            req = req.use_implicit_flow();
        }

        let (url, state) = req.url();
        Ok((EndUserVerificationUrl::from_url(url), state))
    }

    /// Initiates the Device Code Authentication Flow.
    ///
    /// After presenting the returned [`crate::oauth2:: EndUserVerificationUrl`] and [`crate::oauth2::UserCode`]
    /// to the user, call `poll_device_code_auth`.
    ///
    /// You can transform the returned value into [`crate::oauth2::VerificationUriComplete`] by calling `get_device_code_verification_uri`.
    ///
    /// # Examples
    ///
    /// ```no_run
    /// use xal::XalAuthenticator;
    ///
    /// let mut authenticator = XalAuthenticator::default();
    /// # tokio_test::block_on(async {
    /// let device_code_resp = authenticator
    ///     .initiate_device_code_auth()
    ///     .await
    ///     .unwrap();
    /// // Present authentication parameters from `device_code_resp` to user
    /// let live_tokens = authenticator
    ///     .poll_device_code_auth(&device_code_resp, tokio::time::sleep)
    ///     .await
    ///     .unwrap();
    ///
    /// println!("{live_tokens:?}");
    /// # });
    /// ```
    pub async fn initiate_device_code_auth(
        &mut self,
    ) -> Result<StandardDeviceAuthorizationResponse, Error> {
        self.oauth_client()?
            .exchange_device_code()
            .unwrap()
            .add_scopes(self.app_params.auth_scopes.clone())
            .add_extra_param("response_type", "device_code")
            .request_async(&async_http_client)
            .await
            .map_err(std::convert::Into::into)
    }

    /// Poll for device code.
    ///
    /// To be called after presenting the result of `start_device_code_auth` to the user.
    ///
    /// # Arguments
    ///
    /// - `sleep_fn` is the impl of an async sleep function
    ///
    /// # Examples
    ///
    /// ```no_run
    /// use xal::XalAuthenticator;
    ///
    /// let mut authenticator = XalAuthenticator::default();
    /// # tokio_test::block_on(async {
    /// let device_code_resp = authenticator
    ///     .initiate_device_code_auth()
    ///     .await
    ///     .unwrap();
    /// // Present authentication parameters from `device_code_resp` to user
    /// let live_tokens = authenticator
    ///     .poll_device_code_auth(&device_code_resp, tokio::time::sleep)
    ///     .await
    ///     .unwrap();
    ///
    /// println!("{live_tokens:?}");
    /// # });
    /// ```
    pub async fn poll_device_code_auth<S, SF>(
        &mut self,
        device_auth_resp: &StandardDeviceAuthorizationResponse,
        sleep_fn: S,
    ) -> Result<response::WindowsLiveTokens, Error>
    where
        S: Fn(std::time::Duration) -> SF,
        SF: std::future::Future<Output = ()>,
    {
        self.oauth_client()?
            .exchange_device_access_token(device_auth_resp)
            .request_async(&async_http_client, sleep_fn, None)
            .await
            .map_err(std::convert::Into::into)
    }

    /// Exchange OAuth2 Authorization Token for Windows Live Access Token.
    ///
    /// This method utilizes the PKCE extension to securely obtain an access token from the Microsoft Identity Platform.
    ///
    /// # Arguments
    ///
    /// * `authorization_code` - The authorization code received from the user authentication step.
    /// * `code_verifier` - The code verifier that was generated earlier in the PKCE process. This parameter is optional.
    ///
    /// # Examples
    ///
    /// ```
    /// use xal::XalAuthenticator;
    /// use xal::oauth2::{AuthorizationCode, TokenResponse};
    /// # async fn demo_code() -> Result<(), Box<dyn std::error::Error>> {
    /// let mut authenticator = XalAuthenticator::default();
    /// let code = AuthorizationCode::new("123".to_string());
    /// let live_tokens = authenticator
    ///     .exchange_code_for_token(code, None)
    ///     .await?;
    ///
    /// assert!(!live_tokens.access_token().secret().is_empty());
    /// # Ok(())
    /// # }
    /// ```
    pub async fn exchange_code_for_token(
        &mut self,
        authorization_code: AuthorizationCode,
        code_verifier: Option<PkceCodeVerifier>,
    ) -> Result<response::WindowsLiveTokens, Error> {
        let client = self.oauth_client()?;

        let mut req = client.exchange_code(authorization_code);

        if let Some(redirect_url) = &self.app_params.redirect_uri {
            req = req.set_redirect_uri(std::borrow::Cow::Owned(redirect_url.clone()));
        }

        if let Some(pkce) = code_verifier {
            req = req.set_pkce_verifier(pkce)
        }

        req.request_async(&async_http_client)
            .await
            .map_err(std::convert::Into::into)
    }

    /// Refresh an OAuth2 Refresh Token for specific scope(s) and deserialize into custom response type
    ///
    /// This is used when the token response does not align with the standard.
    ///
    /// # Examples
    ///
    /// ```
    /// use xal::XalAuthenticator;
    /// use xal::oauth2::{RefreshToken, Scope};
    /// use serde::{Deserialize, Serialize};
    ///
    /// // Custom JSON response body
    /// #[derive(Debug, Serialize, Deserialize)]
    /// pub struct XCloudTokenResponse {
    ///     pub lpt: String,
    ///     pub refresh_token: String,
    ///     pub user_id: String,
    /// }
    ///
    /// # async fn demo_code() {
    /// # let refresh_token = RefreshToken::new("...refresh token...".into());
    /// let mut authenticator = XalAuthenticator::default();
    /// let scopes = vec![
    ///     Scope::new(
    ///         "service::http://Passport.NET/purpose::PURPOSE_XBOX_CLOUD_CONSOLE_TRANSFER_TOKEN".into()
    ///     )
    /// ];
    ///
    /// let token_response = authenticator
    ///     .refresh_token_for_scope::<XCloudTokenResponse>(
    ///         &refresh_token,
    ///         scopes
    ///     )
    ///     .await
    ///     .unwrap();
    /// # }
    /// ```
    ///
    pub async fn refresh_token_for_scope<T>(
        &mut self,
        refresh_token: &RefreshToken,
        scopes: Vec<Scope>,
    ) -> Result<T, Error>
    where
        T: serde::de::DeserializeOwned,
    {
        let resp = self
            .oauth_client()?
            .exchange_refresh_token(refresh_token)
            .add_scopes(scopes)
            .request_async(&async_http_client)
            .await;

        // HACK: Catch message body from parsing failure and parse it ourselves
        match resp {
            Ok(res) => serde_json::from_value::<T>(serde_json::json!(&res))
                .map_err(std::convert::Into::into),
            Err(RequestTokenError::Parse(_, data)) => {
                serde_json::from_slice(&data).map_err(std::convert::Into::into)
            }
            Err(e) => Err(std::convert::Into::into(e)),
        }
    }

    /// Refresh a Windows Live Refresh & Access Token by providing a Refresh Token
    ///
    /// # Arguments
    ///
    /// * `refresh_token` - The refresh token to use for obtaining a new access token
    ///
    /// # Examples
    ///
    /// ```no_run
    /// use xal::XalAuthenticator;
    /// use xal::oauth2::RefreshToken;
    ///
    /// let mut authenticator = XalAuthenticator::default();
    /// let refresh_token = RefreshToken::new("old_refresh_token".to_string());
    /// # tokio_test::block_on(async {
    /// let refreshed_live_tokens = authenticator
    ///     .refresh_token(&refresh_token)
    ///     .await
    ///     .unwrap();
    ///
    /// println!("Refreshed tokens: {refreshed_live_tokens:?}");
    /// # });
    /// ```
    pub async fn refresh_token(
        &mut self,
        refresh_token: &RefreshToken,
    ) -> Result<response::WindowsLiveTokens, Error> {
        self.refresh_token_for_scope(refresh_token, self.app_params.auth_scopes.clone())
            .await
    }
}

/// Xbox Live token functionality
impl XalAuthenticator {
    /// Initiate authentication via SISU flow
    ///
    /// # Parameters
    ///
    /// * `device_token`: A [`response::DeviceToken`] object representing the device token.
    /// * `code_challenge`: A [`PkceCodeChallenge`] object representing the code challenge.
    /// * `state`: A [`CsrfToken`] object representing the CSRF token.
    ///
    /// # Errors
    ///
    /// * If `device_token` is missing.
    /// * If `redirect_uri` is missing.
    /// * If the Sisu Authentication request fails.
    ///
    /// # Examples
    ///
    /// ```
    /// use xal::XalAuthenticator;
    /// use xal::url::Url;
    ///
    /// # async fn demo_code() {
    /// let mut authenticator = XalAuthenticator::default();
    /// let state = XalAuthenticator::generate_random_state();
    /// let (pkce_challenge, pkce_verifier) = XalAuthenticator::generate_code_verifier();
    /// let device_token = authenticator.get_device_token()
    ///     .await
    ///     .unwrap();
    ///
    /// let (resp, session_id) = authenticator.sisu_authenticate(
    ///     &device_token,
    ///     &pkce_challenge,
    ///     &state
    /// )
    /// .await
    /// .unwrap();
    ///
    /// println!(
    ///     "Visit this url and pass back the redirect url containing the authorization code {}",
    ///     resp.msa_oauth_redirect
    /// );
    /// let redirect_url = Url::parse("https://example.com/?code=123").unwrap();
    ///
    /// let authorization_code = XalAuthenticator::parse_authorization_code_response(
    ///     &redirect_url, Some(&state)
    /// ).unwrap();
    ///
    /// let live_tokens = authenticator.exchange_code_for_token(
    ///     authorization_code, Some(pkce_verifier)
    /// )
    /// .await
    /// .unwrap();
    ///
    /// let sisu_authorization_resp = authenticator.sisu_authorize(
    ///     &live_tokens, &device_token, Some(session_id)
    /// )
    /// .await
    /// .unwrap();
    /// # }
    /// ```
    ///
    /// # Notes
    ///
    /// It is mandatory to have [`XalAppParameters`] setup with a `redirect_uri` and `title_id`.
    pub async fn sisu_authenticate(
        &mut self,
        device_token: &response::DeviceToken,
        code_challenge: &PkceCodeChallenge,
        state: &CsrfToken,
    ) -> Result<
        (
            response::SisuAuthenticationResponse,
            response::SisuSessionId,
        ),
        Error,
    > {
        let title_id = self
            .app_params
            .title_id
            .clone()
            .ok_or(Error::InvalidRequest(
                "Sisu authentication not possible without title Id (check XalAppParameters)".into(),
            ))?;

        let json_body = request::SisuAuthenticationRequest {
            app_id: &self.app_params.client_id,
            title_id: &title_id,
            redirect_uri: self.app_params.redirect_uri.as_deref().ok_or(
                Error::InvalidRedirectUrl("sisu_authenticate requires Redirect URL".to_string()),
            )?,
            device_token: &device_token.token,
            sandbox: &self.sandbox_id,
            token_type: "code",
            offers: vec![Constants::SCOPE_SERVICE_USER_AUTH],
            query: request::SisuQuery {
                display: &self.client_params.query_display,
                code_challenge: code_challenge.as_str(),
                code_challenge_method: code_challenge.method(),
                state: state.secret(),
            },
        };

        let resp = self
            .client
            .post(Constants::XBOX_SISU_AUTHENTICATE_URL)
            .header("x-xbl-contract-version", "1")
            .add_cv(&mut self.ms_cv)?
            .json(&json_body)
            .sign(&mut self.request_signer, None)
            .await?
            .send()
            .await?;

        let session_id = resp
            .headers()
            .get("X-SessionId")
            .ok_or(Error::GeneralError("Missing X-SessionId".to_owned()))?
            .to_str()
            .map_err(|e| Error::GeneralError(e.to_string()))?
            .to_owned();

        let resp_json = resp
            .json_ex::<response::SisuAuthenticationResponse>()
            .await?;

        Ok((resp_json, response::SisuSessionId(session_id)))
    }

    /// Authorize via SISU flow after completing OAuth2 Authentication
    ///
    /// This function handles the second step of the SISU flow.
    /// The response from the server contains a collection of tokens, which can be used for further interaction with the Xbox Live service.
    ///
    /// # Examples
    ///
    /// ```
    /// use xal::XalAuthenticator;
    /// use xal::url::Url;
    ///
    /// # async fn demo_code() {
    /// let mut authenticator = XalAuthenticator::default();
    /// let state = XalAuthenticator::generate_random_state();
    /// let (pkce_challenge, pkce_verifier) = XalAuthenticator::generate_code_verifier();
    /// let device_token = authenticator.get_device_token()
    ///     .await
    ///     .unwrap();
    ///
    /// let (resp, session_id) = authenticator.sisu_authenticate(
    ///     &device_token,
    ///     &pkce_challenge,
    ///     &state
    /// )
    /// .await
    /// .unwrap();
    ///
    /// println!(
    ///     "Visit this url and pass back the redirect url containing the authorization code {}",
    ///     resp.msa_oauth_redirect
    /// );
    /// let redirect_url = Url::parse("https://example.com/?code=123").unwrap();
    ///
    /// let authorization_code = XalAuthenticator::parse_authorization_code_response(
    ///     &redirect_url, Some(&state)
    /// ).unwrap();
    ///
    /// let live_tokens = authenticator.exchange_code_for_token(
    ///     authorization_code, Some(pkce_verifier)
    /// )
    /// .await
    /// .unwrap();
    ///
    /// let sisu_authorization_resp = authenticator.sisu_authorize(
    ///     &live_tokens, &device_token, Some(session_id)
    /// )
    /// .await
    /// .unwrap();
    /// # }
    /// ```
    pub async fn sisu_authorize(
        &mut self,
        access_token: &response::WindowsLiveTokens,
        device_token: &response::DeviceToken,
        sisu_session_id: Option<response::SisuSessionId>,
    ) -> Result<response::SisuAuthorizationResponse, Error> {
        let json_body = request::SisuAuthorizationRequest {
            access_token: &format!("t={}", access_token.access_token().secret()),
            app_id: &self.app_params.client_id,
            device_token: &device_token.token,
            sandbox: &self.sandbox_id.clone(),
            site_name: "user.auth.xboxlive.com",
            session_id: sisu_session_id.map(|a| a.0),
            proof_key: self.request_signer.get_proof_key(),
        };

        self.client
            .post(Constants::XBOX_SISU_AUTHORIZE_URL)
            .add_cv(&mut self.ms_cv)?
            .json(&json_body)
            .sign(&mut self.request_signer, None)
            .await?
            .send()
            .await?
            .json_ex::<response::SisuAuthorizationResponse>()
            .await
            .map_err(std::convert::Into::into)
    }

    /// Requests a Xbox Live Device Token from the Xbox Live authentication service.
    ///
    /// This method is responsible for requesting a Xbox Live Device Token, which identifies a client device to the Xbox service.
    ///
    /// # Errors
    ///
    /// This method returns an `Error` if the POST request fails or the JSON response cannot be parsed.
    ///
    /// # Examples
    ///
    /// ```
    /// # async fn demo_code() {
    /// use xal::XalAuthenticator;
    ///
    /// let mut authenticator = XalAuthenticator::default();
    /// let device_token = authenticator.get_device_token()
    ///     .await
    ///     .unwrap();
    ///
    /// assert!(!device_token.token.is_empty());
    /// # }
    /// ```
    ///
    /// # Notes
    ///
    /// Device tokens can only be requested for devices of the following type:
    ///
    /// - Android
    /// - iOS
    /// - Nintendo
    /// - Win32
    ///
    /// Xbox devices use a much more sophisticated request method.
    pub async fn get_device_token(&mut self) -> Result<response::DeviceToken, Error> {
        let device_id = self.device_id.hyphenated().to_string();
        let client_uuid: String = match self.client_params.device_type {
            // {decf45e4-945d-4379-b708-d4ee92c12d99}
            DeviceType::ANDROID | DeviceType::NINTENDO => ["{", &device_id, "}"].concat(),
            // DECF45E4-945D-4379-B708-D4EE92C12D99
            DeviceType::IOS => device_id.to_uppercase(),
            // Unknown
            _ => device_id,
        };

        let json_body = XTokenRequest::<XADProperties> {
            relying_party: Constants::RELYING_PARTY_AUTH_XBOXLIVE,
            token_type: "JWT",
            properties: XADProperties {
                auth_method: "ProofOfPossession",
                id: client_uuid.as_str(),
                device_type: &self.client_params.device_type.to_string(),
                version: &self.client_params.client_version,
                proof_key: self.request_signer.get_proof_key(),
            },
        };

        self.client
            .post(Constants::XBOX_DEVICE_AUTH_URL)
            .header("x-xbl-contract-version", "1")
            .add_cv(&mut self.ms_cv)?
            .json(&json_body)
            .sign(&mut self.request_signer, None)
            .await?
            .send()
            .await?
            .json_ex::<response::DeviceToken>()
            .await
            .map_err(std::convert::Into::into)
    }

    /// Retrieves a Xbox User Token for a specified Access Token.
    ///
    /// This method sends a POST request to the Xbox Live User Authentication URL, using the provided
    /// `access_token` and `prefix`.
    ///
    /// The resulting User Token is then used to retrieve the final *XSTS* token to access Xbox Live services.
    ///
    /// # Arguments
    ///
    /// * `access_token` - The Windows Live access token.
    /// * `prefix` - The access token prefix, either "d=", "t=" or *None*.
    ///
    /// # Errors
    ///
    /// This method returns an [`crate::Error`] if the POST request fails or the JSON response cannot be parsed.
    ///
    /// # Examples
    ///
    /// ```
    /// use xal::{XalAuthenticator, Flows, Error, AccessTokenPrefix, CliCallbackHandler};
    /// use xal::response::WindowsLiveTokens;
    ///
    /// # async fn example() -> Result<(), Error> {
    /// let mut authenticator = XalAuthenticator::default();
    ///
    /// let token_store = Flows::ms_device_code_flow(
    ///     &mut authenticator,
    ///     CliCallbackHandler,
    ///     tokio::time::sleep
    /// )
    /// .await?;
    ///
    /// let user_token = authenticator.get_user_token(
    ///     &token_store.live_token,
    ///     AccessTokenPrefix::D,
    /// )
    /// .await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn get_user_token(
        &mut self,
        access_token: &response::WindowsLiveTokens,
        prefix: AccessTokenPrefix,
    ) -> Result<response::UserToken, Error> {
        let json_body = XTokenRequest::<XASUProperties> {
            relying_party: Constants::RELYING_PARTY_AUTH_XBOXLIVE,
            token_type: "JWT",
            properties: XASUProperties {
                auth_method: "RPS",
                site_name: "user.auth.xboxlive.com",
                rps_ticket: &format!(
                    "{}{}",
                    prefix.to_string(),
                    access_token.access_token().secret()
                ),
            },
        };

        self.client
            .post(Constants::XBOX_USER_AUTH_URL)
            .header("x-xbl-contract-version", "1")
            .add_cv(&mut self.ms_cv)?
            .json(&json_body)
            .sign(&mut self.request_signer, None)
            .await?
            .log()
            .await?
            .send()
            .await?
            .log()
            .await?
            .json_ex::<response::UserToken>()
            .await
            .map_err(std::convert::Into::into)
    }

    /// Retrieves a Title Token for a specified Access Token and Device Token.
    ///
    /// This method sends a POST request to the Xbox Live Title Authentication URL, using the provided
    /// `access_token` and `device_token`.
    ///
    /// The resulting Title Token is then used to retrieve the final *XSTS* token to access Xbox Live services.
    ///
    /// # Arguments
    ///
    /// * `access_token` - The Windows Live access token.
    /// * `device_token` - The Xbox Live device token.
    ///
    /// # Errors
    ///
    /// This method returns an `Error` if the POST request fails or the JSON response cannot be parsed.
    ///
    /// # Examples
    ///
    /// ```
    /// use xal::{XalAuthenticator, Flows, Error, AccessTokenPrefix, CliCallbackHandler};
    ///
    /// # async fn example() -> Result<(), Error> {
    /// let mut authenticator = XalAuthenticator::new(
    ///     xal::app_params::MC_BEDROCK_SWITCH(),
    ///     xal::client_params::CLIENT_NINTENDO(),
    ///     "RETAIL".into()
    /// );
    ///
    /// let token_store = Flows::ms_device_code_flow(
    ///     &mut authenticator,
    ///     CliCallbackHandler,
    ///     tokio::time::sleep
    /// )
    /// .await?;
    ///
    /// let device_token = authenticator.get_device_token()
    ///     .await?;
    ///  
    /// let title_token = authenticator.get_title_token(
    ///     &token_store.live_token,
    ///     &device_token,
    /// )
    /// .await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn get_title_token(
        &mut self,
        access_token: &response::WindowsLiveTokens,
        device_token: &response::DeviceToken,
    ) -> Result<response::TitleToken, Error> {
        let json_body = XTokenRequest::<XASTProperties> {
            relying_party: Constants::RELYING_PARTY_AUTH_XBOXLIVE,
            token_type: "JWT",
            properties: XASTProperties {
                auth_method: "RPS",
                site_name: "user.auth.xboxlive.com",
                rps_ticket: &format!("t={}", access_token.access_token().secret()),
                device_token: &device_token.token,
            },
        };

        self.client
            .post(Constants::XBOX_TITLE_AUTH_URL)
            .header("x-xbl-contract-version", "1")
            .add_cv(&mut self.ms_cv)?
            .json(&json_body)
            .sign(&mut self.request_signer, None)
            .await?
            .log()
            .await?
            .send()
            .await?
            .log()
            .await?
            .json_ex::<response::TitleToken>()
            .await
            .map_err(std::convert::Into::into)
    }

    /// Authenticates with the Xbox Live service and retrieves an XSTS token.
    ///
    /// This method sends a POST request to the Xbox Live XSTS Authentication URL, using the provided `relying_party`
    /// and optionally `device_token`, `title_token`, and `user_token`.
    ///
    /// The resulting XSTS token can be used to authenticate with various Xbox Live services.
    ///
    /// # Arguments
    ///
    /// * `device_token` - (Optional) The Xbox Live device token.
    /// * `title_token` - (Optional) The Xbox Live title token.
    /// * `user_token` - (Optional) The Xbox Live user token.
    /// * `relying_party` - The relying party of the application.
    ///
    /// # Errors
    ///
    /// This method returns an `Error` if the POST request fails or the JSON response cannot be parsed.
    ///
    /// # Examples
    ///
    /// ```
    /// use xal::{XalAuthenticator, Flows, Error, AccessTokenPrefix, CliCallbackHandler};
    /// use xal::response::WindowsLiveTokens;
    ///
    /// # async fn example() -> Result<(), Error> {
    /// let mut authenticator = XalAuthenticator::new(
    ///     xal::app_params::MC_BEDROCK_SWITCH(),
    ///     xal::client_params::CLIENT_NINTENDO(),
    ///     "RETAIL".into()
    /// );
    ///
    /// let token_store = Flows::ms_device_code_flow(
    ///     &mut authenticator,
    ///     CliCallbackHandler,
    ///     tokio::time::sleep
    /// )
    /// .await?;
    ///
    /// let device_token = authenticator.get_device_token()
    ///     .await?;
    ///  
    /// let title_token = authenticator.get_title_token(
    ///     &token_store.live_token,
    ///     &device_token,
    /// )
    /// .await?;
    ///
    /// let user_token = authenticator.get_user_token(
    ///     &token_store.live_token,
    ///     AccessTokenPrefix::None,
    /// )
    /// .await?;
    ///
    /// let xsts_token = authenticator.get_xsts_token(
    ///     Some(&device_token),
    ///     Some(&title_token),
    ///     Some(&user_token),
    ///     "rp://api.minecraftservices.com/",
    /// ).await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn get_xsts_token(
        &mut self,
        device_token: Option<&response::DeviceToken>,
        title_token: Option<&response::TitleToken>,
        user_token: Option<&response::UserToken>,
        relying_party: &str,
    ) -> Result<response::XSTSToken, Error> {
        let dtoken = device_token.map(|t| t.token.clone());
        let ttoken = title_token.map(|t| t.token.clone());

        let json_body = XTokenRequest::<XSTSProperties> {
            relying_party,
            token_type: "JWT",
            properties: XSTSProperties {
                sandbox_id: &self.sandbox_id,
                device_token: dtoken.as_deref(),
                title_token: ttoken.as_deref(),
                user_tokens: if let Some(token) = user_token {
                    vec![&token.token]
                } else {
                    vec![]
                },
            },
        };

        self.client
            .post(Constants::XBOX_XSTS_AUTH_URL)
            .header("x-xbl-contract-version", "1")
            .add_cv(&mut self.ms_cv)?
            .json(&json_body)
            .sign(&mut self.request_signer, None)
            .await?
            .log()
            .await?
            .send()
            .await?
            .log()
            .await?
            .json_ex::<response::XSTSToken>()
            .await
            .map_err(std::convert::Into::into)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use oauth2::{basic::BasicTokenType, RequestTokenError};
    use std::time::Duration;

    fn parse_authorization_code_response(
        url: &'static str,
        state: Option<String>,
    ) -> Result<AuthorizationCode, Error> {
        let url = Url::parse(url)?;
        let csrf_state = state.map(CsrfToken::new);
        XalAuthenticator::parse_authorization_code_response(&url, csrf_state.as_ref())
    }

    #[test]
    #[should_panic = "UrlParseError"]
    fn authorization_code_response_empty() {
        parse_authorization_code_response("", None).unwrap();
    }

    #[test]
    #[should_panic = "Expected 'state'"]
    fn authorization_code_response_no_state() {
        parse_authorization_code_response(
            "ms-xal-public-beta-000000004c20a908://?code=123",
            Some("ABC".to_string()),
        )
        .unwrap();
    }

    #[test]
    fn authorization_code_response_valid_code() {
        let ret = parse_authorization_code_response(
            "ms-xal-public-beta-000000004c20a908://?code=123",
            None,
        )
        .unwrap();
        assert_eq!(ret.secret(), "123")
    }

    #[test]
    fn authorization_code_response_error() {
        let ret = parse_authorization_code_response("ms-xal-public-beta-000000004c20a908://?error=unknown_error&error_description=some_error_desc&error_uri=some_error_uri", None);

        assert!(ret.is_err());
        match ret {
            Err(Error::OAuthExecutionError(RequestTokenError::ServerResponse(err))) => {
                assert_eq!(
                    err.error(),
                    &BasicErrorResponseType::Extension("unknown_error".to_string())
                );
                assert_eq!(
                    err.error_description(),
                    Some(&"some_error_desc".to_string())
                );
                assert_eq!(err.error_uri(), Some(&"some_error_uri".to_string()));
            }
            _ => panic!("Unexpected error for this test"),
        }
    }

    #[test]
    fn implicit_grant_parsing() {
        let redirect_url = Url::parse("https://login.live.com/oauth20_desktop.srf?lc=1033#access_token=EwAYA%2bSpFvzVdqQK4qPrPticr6YwVhZtUQYx8QEmKUlOy48j/DFgHrsUGfdoE7UnUZ6thRthHLq5YHXpn1rvRA7hGWiilt08MnbIEVy0ZPCyNx/1yiHe4Y7iEs40TrkH6i7FW3B0sk2WPuFQFI8B592TnR74yxpdMntpzpPdM34gdPGPtBDLiIvHdvRJMMj95JsOm/f2MZiQd/3L0L92CIAwwUdx/HLrfw85Va6jsL2y39bxI56xivbMj6e6eAFRX3eMfH8lRiO2Ro58KnG8fFncduisPOAVf2fcsQM0DxjboKLSUgB7d4qwc0iIMcrdvCQjCi2d202tXPlwjKYCgeYls7nEn3xGu31dvbygnGrz/jeO1NwWzrrSAqxk9sF0sEwm1hsyES2Q5RVJkj4xvHNMLSsXGmZMe7yRqPUU7enRii8Jg7NGIvA&token_type=bearer&expires_in=86400&scope=service::user.auth.xboxlive.com::MBI_SSL&refresh_token=M.C104_BL2.-AfLD2hcS42M2c867oIQF27DQ5ldU9JNt5yfOv5V2picnPBloUElr5I7Qg25xkjaKGifYXRwJUtJi1gT6JBr3d2fLE8Gh323VS9Oz3pk89ygxxkPjQlhIlx6m6F1t919SaqJw3tXID5OT8EmadB4vLcjcLotlS2l2CMuo4q/lP/DyJqQ5pzryGdRWu4oHott4Ubylo8r3qUw9JgntYHTBxbo2kJFkkTp8ue6Yd82kXQNBEhVqmpKzE6eGeNX5HzD35MFis2YlAndF8QW8GnGW9X3zIKHvOVOG4XJt8ZLI81LDMoiAaYJ7kPDEXtDXmWxoGaOpR/Zff6PkyKEbuWS0ZxPtQqqWH2efnx4SODcz7WjaM3DerG6DQJhqFHtGOa3MwMNw420Zl1SQIVlIksLpGZmiSqCBKRyjSbuddZQ2away4Q%24%24&user_id=0787a39b92e882f4d7e&state=XpdMe7g3jH5UZQ").expect("Failed to parse URL");
        let state = CsrfToken::new("XpdMe7g3jH5UZQ".to_string());
        let live_tokens = XalAuthenticator::parse_implicit_grant_url(&redirect_url, Some(&state))
            .expect("Failed parsing..");

        assert_eq!(live_tokens.token_type(), &BasicTokenType::Bearer);
        assert_eq!(live_tokens.access_token().secret(), "EwAYA+SpFvzVdqQK4qPrPticr6YwVhZtUQYx8QEmKUlOy48j/DFgHrsUGfdoE7UnUZ6thRthHLq5YHXpn1rvRA7hGWiilt08MnbIEVy0ZPCyNx/1yiHe4Y7iEs40TrkH6i7FW3B0sk2WPuFQFI8B592TnR74yxpdMntpzpPdM34gdPGPtBDLiIvHdvRJMMj95JsOm/f2MZiQd/3L0L92CIAwwUdx/HLrfw85Va6jsL2y39bxI56xivbMj6e6eAFRX3eMfH8lRiO2Ro58KnG8fFncduisPOAVf2fcsQM0DxjboKLSUgB7d4qwc0iIMcrdvCQjCi2d202tXPlwjKYCgeYls7nEn3xGu31dvbygnGrz/jeO1NwWzrrSAqxk9sF0sEwm1hsyES2Q5RVJkj4xvHNMLSsXGmZMe7yRqPUU7enRii8Jg7NGIvA");
        assert_eq!(live_tokens.refresh_token().unwrap().secret(), "M.C104_BL2.-AfLD2hcS42M2c867oIQF27DQ5ldU9JNt5yfOv5V2picnPBloUElr5I7Qg25xkjaKGifYXRwJUtJi1gT6JBr3d2fLE8Gh323VS9Oz3pk89ygxxkPjQlhIlx6m6F1t919SaqJw3tXID5OT8EmadB4vLcjcLotlS2l2CMuo4q/lP/DyJqQ5pzryGdRWu4oHott4Ubylo8r3qUw9JgntYHTBxbo2kJFkkTp8ue6Yd82kXQNBEhVqmpKzE6eGeNX5HzD35MFis2YlAndF8QW8GnGW9X3zIKHvOVOG4XJt8ZLI81LDMoiAaYJ7kPDEXtDXmWxoGaOpR/Zff6PkyKEbuWS0ZxPtQqqWH2efnx4SODcz7WjaM3DerG6DQJhqFHtGOa3MwMNw420Zl1SQIVlIksLpGZmiSqCBKRyjSbuddZQ2away4Q$$");
        //assert_eq!(live_tokens.user_id(), "0787a39b92e882f4d7e");
        assert_eq!(live_tokens.expires_in(), Some(Duration::from_secs(86400)));
        assert_eq!(live_tokens.scopes().unwrap().len(), 1);
        assert_eq!(
            live_tokens.scopes().unwrap().first().unwrap().to_string(),
            "service::user.auth.xboxlive.com::MBI_SSL"
        );
    }
}
