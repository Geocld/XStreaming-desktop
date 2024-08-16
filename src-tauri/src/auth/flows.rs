//! Higher-level, bundled functionality for common tasks
use async_trait::async_trait;
use log::{debug, info, trace};
use oauth2::{
    EndUserVerificationUrl, StandardDeviceAuthorizationResponse, TokenResponse, UserCode,
    VerificationUriComplete,
};
use url::Url;

use crate::auth::models::response::{SisuAuthenticationResponse, WindowsLiveTokens};
use crate::auth::models::AccessTokenPrefix;
use crate::auth::tokenstore::TokenStore;
use crate::auth::error::Error;
use crate::auth::authenticator::XalAuthenticator;

/// Argument passed into [`crate::flows::AuthPromptCallback`]
#[derive(Debug)]
pub enum AuthPromptData {
    /// User action request for authorization code / implict grant flow
    /// It requires the user to visit an URL and pass back the returned redirect URL
    RedirectUrl {
        /// Prompt message for the user
        prompt: String,
        /// URL to use for authentication
        url: EndUserVerificationUrl,
        /// Whether the caller expects a redirect URL with authorization data
        expect_url: bool,
    },

    /// User action request for device code flow
    /// It should return directly after showing the action prompt to the user
    DeviceCode {
        /// Prompt message for the user
        prompt: String,
        /// URL to use for authentication
        url: EndUserVerificationUrl,
        /// Code the user has to enter in the webform to authenticate
        code: UserCode,
        /// The complete URL with pre-filled UserCode
        full_verificiation_url: VerificationUriComplete,
        /// Whether the caller expects a redirect URL
        expect_url: bool,
    },
}

impl From<SisuAuthenticationResponse> for AuthPromptData {
    fn from(value: SisuAuthenticationResponse) -> Self {
        Self::RedirectUrl {
            prompt: format!(
                "!!! ACTION REQUIRED !!!\nNavigate to this URL and authenticate: {0} (Query params: {1:?})\n
                \nThen enter the resulting redirected URL (might need to open DevTools in your browser before opening the link)",
                value.msa_oauth_redirect,
                value.msa_request_parameters,
            ),
            url: EndUserVerificationUrl::from_url(value.msa_oauth_redirect.clone()),
            expect_url: true,
        }
    }
}

impl From<StandardDeviceAuthorizationResponse> for AuthPromptData {
    fn from(value: StandardDeviceAuthorizationResponse) -> Self {
        let user_code = value.user_code().to_owned();
        let verification_uri = value.verification_uri().to_owned();
        let full_url = XalAuthenticator::get_device_code_verification_uri(value.user_code());

        Self::DeviceCode {
            prompt: format!(
                "!!! ACTION REQUIRED !!!\nNavigate to this URL and authenticate: {0}\nUse code: {1}\n\nAlternatively, use this link: {2}",
                verification_uri.as_str(),
                user_code.secret(),
                full_url.secret(),
            ),
            url: verification_uri,
            code: user_code,
            full_verificiation_url: full_url,
            expect_url: false,
        }
    }
}

impl From<EndUserVerificationUrl> for AuthPromptData {
    fn from(value: EndUserVerificationUrl) -> Self {
        Self::RedirectUrl {
            prompt: format!(
                "!!! ACTION REQUIRED !!!\nNavigate to this URL and authenticate: {0}\nNOTE: You might have to open DevTools when navigating the flow to catch redirect",
                value.as_str()
            ),
            url: value.to_owned(),
            expect_url: true,
        }
    }
}

impl AuthPromptData {
    /// Return user prompt string aka. instructions of which URL the user needs to visit to authenticate
    pub fn prompt(&self) -> String {
        match self {
            AuthPromptData::RedirectUrl { prompt, .. } => prompt.to_owned(),
            AuthPromptData::DeviceCode { prompt, .. } => prompt.to_owned(),
        }
    }

    /// Return whether the callback expects n URL as return value
    pub fn expect_url(&self) -> bool {
        match self {
            AuthPromptData::RedirectUrl { expect_url, .. } => *expect_url,
            AuthPromptData::DeviceCode { expect_url, .. } => *expect_url,
        }
    }

    /// Returns the authentication URL
    pub fn authentication_url(&self) -> Url {
        match self {
            AuthPromptData::RedirectUrl { url, .. } => Url::parse(url.as_str()).unwrap(),
            AuthPromptData::DeviceCode {
                full_verificiation_url,
                ..
            } => Url::parse(full_verificiation_url.secret()).unwrap(),
        }
    }
}

/// Sisu Auth callback trait
///
/// Used as an argument to [`crate::Flows::xbox_live_sisu_full_flow`]
///
///
/// # Examples
///
/// ```
/// # use std::io;
/// # use async_trait::async_trait;
/// # use xal::{XalAuthenticator, AuthPromptCallback, AuthPromptData};
/// # use xal::url::Url;
/// // Define callback handler for OAuth2 flow
/// struct CallbackHandler;
/// # fn do_interactive_oauth2(url: &str) -> String { String::new() }
///
/// #[async_trait]
/// impl AuthPromptCallback for CallbackHandler {
///     async fn call(
///         &self,
///         cb_data: AuthPromptData
///     ) -> Result<Option<Url>, Box<dyn std::error::Error>>
///     {
///         let prompt = cb_data.prompt();
///         let do_expect_url = cb_data.expect_url();
///         println!("{prompt}\n");
///         
///         let res = if do_expect_url {
///             // Read pasted URL from terminal
///             println!("Redirect URL> ");
///             let mut redirect_url = String::new();
///             let _ = io::stdin().read_line(&mut redirect_url)?;
///             Some(Url::parse(&redirect_url)?)
///         } else {
///             // Callback does not expect any user input, just return
///             None
///         };
///         
///         Ok(res)
///     }
/// }
/// ```
#[async_trait]
pub trait AuthPromptCallback {
    /// Callback function that is called when the Authentication flow requires the user to perform interactive authentication via a webpage.
    ///
    /// This function takes an argument of type [`crate::flows::AuthPromptData`], which provides the necessary data for the interactive
    /// authentication process.
    ///
    /// The function returns a [`Result`] that represents either a successfully completed interactive authentication or an error that
    /// occurred during the process.
    ///
    /// # Errors
    ///
    /// This function may return an error if the user fails to perform the interactive authentication process or if there is a problem with the underlying authentication process.
    async fn call(
        &self,
        cb_data: AuthPromptData,
    ) -> Result<Option<Url>, Box<dyn std::error::Error>>;
}

/// Implementation of a cli callback handler
///
/// # Examples
///
/// Using the [`CliCallbackHandler`] will prompt the user via commandline for an action.
/// e.g. Browsing to an authentication URL and pasting back the redirect URL incl. authorization data.
///
/// ```no_run
/// use xal::{XalAuthenticator, Flows, Error, CliCallbackHandler};
///
/// # async fn example() -> Result<(), Error> {
/// let mut authenticator = XalAuthenticator::default();
///
/// let token_store = Flows::xbox_live_sisu_full_flow(
///     &mut authenticator,
///     CliCallbackHandler,
/// )
/// .await?;
///
/// # Ok(())
/// # }
/// ```
pub struct CliCallbackHandler;

#[async_trait]
impl AuthPromptCallback for CliCallbackHandler {
    async fn call(
        &self,
        cb_data: AuthPromptData,
    ) -> Result<Option<Url>, Box<dyn std::error::Error>> {
        let prompt = cb_data.prompt();
        let do_expect_url = cb_data.expect_url();

        println!("{prompt}\n");

        let res = if do_expect_url {
            // Read pasted URL from terminal
            print!("Redirect URL> ");
            let mut redirect_url = String::new();
            let _ = std::io::stdin().read_line(&mut redirect_url)?;
            Some(Url::parse(&redirect_url)?)
        } else {
            // Callback does not expect any user input, just return
            None
        };

        Ok(res)
    }
}

/// Higher-level, bundled functionality for common authentication tasks
pub struct Flows;

impl Flows {
    /// Try to deserialize a JSON TokenStore from filepath and refresh the Windows Live tokens if needed.
    ///
    /// # Errors
    ///
    /// This function may return an error if the file cannot be read, fails to deserialize or the
    /// tokens cannot be refreshed.
    ///
    /// # Examples
    ///
    /// ```no_run
    /// # use xal::{Error, Flows, TokenStore};
    ///
    /// # async fn demo_code() -> Result<(), Error> {
    /// // Refresh Windows Live tokens first
    /// let (mut authenticator, token_store) = Flows::try_refresh_live_tokens_from_file("tokens.json")
    ///     .await?;
    ///
    /// // Continue by requesting xbox live tokens
    /// let token_store = Flows::xbox_live_sisu_authorization_flow(
    ///     &mut authenticator,
    ///     token_store.live_token
    /// )
    /// .await?;
    ///
    /// # Ok(())
    /// # }
    /// ```
    ///
    /// # Returns
    ///
    /// If successful, a tuple of [`crate::XalAuthenticator`] and [`crate::tokenstore::TokenStore`]
    /// is returned. TokenStore will contain the refreshed `live_tokens`.
    pub async fn try_refresh_live_tokens_from_file(
        filepath: &str,
    ) -> Result<(XalAuthenticator, TokenStore), Error> {
        let mut ts = TokenStore::load_from_file(filepath)?;
        let authenticator = Self::try_refresh_live_tokens_from_tokenstore(&mut ts).await?;
        Ok((authenticator, ts))
    }

    /// Try to read tokens from the token store and refresh the Windows Live tokens if needed.
    ///
    /// # Examples
    ///
    /// ```no_run
    /// use std::fs::File;
    /// use serde_json;
    /// use xal::{Flows, TokenStore};
    ///
    /// # async fn demo_code() -> Result<(), xal::Error> {
    /// let mut file = File::open("tokens.json")
    ///     .expect("Failed to open tokenfile");
    /// let mut ts: TokenStore = serde_json::from_reader(&mut file)
    ///     .expect("Failed to deserialize TokenStore");
    ///
    /// let authenticator = Flows::try_refresh_live_tokens_from_tokenstore(&mut ts)
    ///     .await
    ///     .expect("Failed refreshing Windows Live tokens");
    /// # Ok(())
    /// # }
    /// ```
    ///
    /// # Errors
    ///
    /// This function may return an error if the token store cannot be read or the tokens cannot be refreshed.
    ///
    /// # Returns
    ///
    /// If successful, a tuple of [`crate::XalAuthenticator`] and [`crate::TokenStore`]
    /// is returned. TokenStore will contain the refreshed `live_tokens`.
    pub async fn try_refresh_live_tokens_from_tokenstore(
        ts: &mut TokenStore,
    ) -> Result<XalAuthenticator, Error> {
        let mut authenticator = Into::<XalAuthenticator>::into(ts.clone());

        info!("Refreshing windows live tokens");
        let refreshed_wl_tokens = authenticator
            .refresh_token(ts.live_token.refresh_token().unwrap())
            .await
            .expect("Failed to exchange refresh token for fresh WL tokens");

        debug!("Windows Live tokens: {:?}", refreshed_wl_tokens);
        ts.live_token = refreshed_wl_tokens.clone();

        Ok(authenticator)
    }

    /// Shorthand for Windows Live device code flow
    ///
    /// # Examples
    ///
    /// ```no_run
    /// use xal::{XalAuthenticator, Flows, Error, AccessTokenPrefix, CliCallbackHandler};
    /// use xal::response::WindowsLiveTokens;
    ///
    /// # async fn async_sleep_fn(_: std::time::Duration) {}
    ///
    /// # async fn example() -> Result<(), Error> {
    /// let mut authenticator = XalAuthenticator::default();
    ///
    /// let token_store = Flows::ms_device_code_flow(
    ///     &mut authenticator,
    ///     CliCallbackHandler,
    ///     async_sleep_fn
    /// )
    /// .await?;
    ///
    /// // TokenStore will only contain live tokens
    /// assert!(token_store.user_token.is_none());
    /// assert!(token_store.title_token.is_none());
    /// assert!(token_store.device_token.is_none());
    /// assert!(token_store.authorization_token.is_none());
    /// # Ok(())
    /// # }
    /// ```
    pub async fn ms_device_code_flow<S, SF>(
        authenticator: &mut XalAuthenticator,
        cb: impl AuthPromptCallback,
        sleep_fn: S,
    ) -> Result<TokenStore, Error>
    where
        S: Fn(std::time::Duration) -> SF,
        SF: std::future::Future<Output = ()>,
    {
        trace!("Initiating device code flow");
        let device_code_flow = authenticator.initiate_device_code_auth().await?;
        debug!("Device code={:?}", device_code_flow);

        trace!("Reaching into callback to notify caller about device code url");
        cb.call(device_code_flow.clone().into())
            .await
            .map_err(|e| Error::GeneralError(format!("Failed getting redirect URL err={e}")))?;

        trace!("Polling for device code");
        let live_tokens = authenticator
            .poll_device_code_auth(&device_code_flow, sleep_fn)
            .await?;

        let ts = TokenStore {
            app_params: authenticator.app_params(),
            client_params: authenticator.client_params(),
            sandbox_id: authenticator.sandbox_id(),
            live_token: live_tokens,
            user_token: None,
            title_token: None,
            device_token: None,
            authorization_token: None,
            updated: None,
        };

        Ok(ts)
    }

    /// Shorthand for Windows Live authorization flow
    /// - Depending on the argument `implicit` the
    /// methods `implicit grant` or `authorization code` are chosen
    ///
    /// # Examples
    ///
    /// ```no_run
    /// use xal::{XalAuthenticator, Flows, Error, AccessTokenPrefix, CliCallbackHandler};
    /// use xal::response::WindowsLiveTokens;
    ///
    /// # async fn example() -> Result<(), Error> {
    /// let do_implicit_flow = true;
    /// let mut authenticator = XalAuthenticator::default();
    ///
    /// let token_store = Flows::ms_authorization_flow(
    ///     &mut authenticator,
    ///     CliCallbackHandler,
    ///     do_implicit_flow,
    /// )
    /// .await?;
    ///
    /// // TokenStore will only contain live tokens
    /// assert!(token_store.user_token.is_none());
    /// assert!(token_store.title_token.is_none());
    /// assert!(token_store.device_token.is_none());
    /// assert!(token_store.authorization_token.is_none());
    /// # Ok(())
    /// # }
    /// ```
    pub async fn ms_authorization_flow(
        authenticator: &mut XalAuthenticator,
        cb: impl AuthPromptCallback,
        implicit: bool,
    ) -> Result<TokenStore, Error> {
        trace!("Starting implicit authorization flow");

        let (url, state) = authenticator.get_authorization_url(implicit)?;

        trace!("Reaching into callback to receive authentication redirect URL");
        let redirect_url = cb
            .call(url.into())
            .await
            .map_err(|e| Error::GeneralError(format!("Failed getting redirect URL err={e}")))?
            .ok_or(Error::GeneralError(
                "Failed receiving redirect URL".to_string(),
            ))?;

        debug!("From callback: Redirect URL={:?}", redirect_url);

        let live_tokens = if implicit {
            trace!("Parsing (implicit grant) redirect URI");
            XalAuthenticator::parse_implicit_grant_url(&redirect_url, Some(&state))?
        } else {
            trace!("Parsing (authorization code) redirect URI");
            let authorization_code =
                XalAuthenticator::parse_authorization_code_response(&redirect_url, Some(&state))?;
            debug!("Authorization Code: {:?}", &authorization_code);

            trace!("Getting Windows Live tokens (exchange code)");
            authenticator
                .exchange_code_for_token(authorization_code, None)
                .await?
        };

        let ts = TokenStore {
            app_params: authenticator.app_params(),
            client_params: authenticator.client_params(),
            sandbox_id: authenticator.sandbox_id(),
            live_token: live_tokens,
            user_token: None,
            title_token: None,
            device_token: None,
            authorization_token: None,
            updated: None,
        };

        Ok(ts)
    }

    /// Shorthand for sisu authentication flow
    ///
    /// # Examples
    ///
    /// ```no_run
    /// use xal::{XalAuthenticator, Flows, Error, CliCallbackHandler};
    ///
    /// # async fn example() -> Result<(), Error> {
    /// let mut authenticator = XalAuthenticator::default();
    ///
    /// let token_store = Flows::xbox_live_sisu_full_flow(
    ///     &mut authenticator,
    ///     CliCallbackHandler,
    /// )
    /// .await?;
    ///
    /// // TokenStore will contain user/title/device/xsts tokens
    /// assert!(token_store.user_token.is_some());
    /// assert!(token_store.title_token.is_some());
    /// assert!(token_store.device_token.is_some());
    /// assert!(token_store.authorization_token.is_some());
    /// # Ok(())
    /// # }
    /// ```
    pub async fn xbox_live_sisu_full_flow(
        authenticator: &mut XalAuthenticator,
        callback: impl AuthPromptCallback,
    ) -> Result<TokenStore, Error> {
        trace!("Getting device token");
        let device_token = authenticator.get_device_token().await?;
        debug!("Device token={:?}", device_token);
        let (code_challenge, code_verifier) = XalAuthenticator::generate_code_verifier();
        trace!("Generated Code verifier={:?}", code_verifier);
        trace!("Generated Code challenge={:?}", code_challenge);
        let state = XalAuthenticator::generate_random_state();
        trace!("Generated random state={:?}", state);

        trace!("Fetching SISU authentication URL and Session Id");
        let (auth_resp, session_id) = authenticator
            .sisu_authenticate(&device_token, &code_challenge, &state)
            .await?;
        debug!(
            "SISU Authenticate response={:?} Session Id={:?}",
            auth_resp, session_id
        );

        // Passing redirect URL to callback and expecting redirect url + authorization token back
        trace!("Reaching into callback to receive authentication redirect URL");
        let redirect_url = callback
            .call(auth_resp.into())
            .await
            .map_err(|e| Error::GeneralError(format!("Failed getting redirect URL err={e}")))?
            .ok_or(Error::GeneralError(
                "Did not receive any Redirect URL from RedirectUrl callback".to_string(),
            ))?;

        debug!("From callback: Redirect URL={:?}", redirect_url);

        trace!("Parsing redirect URI");
        let authorization_code =
            XalAuthenticator::parse_authorization_code_response(&redirect_url, Some(&state))?;

        debug!("Authorization Code: {:?}", &authorization_code);
        trace!("Getting Windows Live tokens (exchange code)");
        let live_tokens = authenticator
            .exchange_code_for_token(authorization_code, Some(code_verifier))
            .await?;
        debug!("Windows live tokens={:?}", &live_tokens);

        trace!("Getting Sisu authorization response");
        let sisu_resp = authenticator
            .sisu_authorize(&live_tokens, &device_token, Some(session_id))
            .await?;
        debug!("Sisu authorizatione response={:?}", sisu_resp);

        let ts = TokenStore {
            app_params: authenticator.app_params(),
            client_params: authenticator.client_params(),
            sandbox_id: authenticator.sandbox_id(),
            live_token: live_tokens,
            device_token: Some(device_token),
            user_token: Some(sisu_resp.user_token),
            title_token: Some(sisu_resp.title_token),
            authorization_token: Some(sisu_resp.authorization_token),

            updated: None,
        };

        Ok(ts)
    }

    /// Implements the traditional Xbox Live authorization flow.
    ///
    /// The method serves as a shorthand for executing the Xbox Live authorization flow by exchanging
    /// [`crate::models::response::WindowsLiveTokens`] to ultimately acquire an authorized Xbox Live session.
    ///
    /// The authorization flow is designed to be highly modular, allowing for extensive customization
    /// based on the specific needs of your application.
    ///
    /// # Arguments
    ///
    /// - `xsts_relying_party` XSTS Relying Party URL (see #Notes)
    /// - `access_token_prefix` Whether AccessToken needs to be prefixed for the Xbox UserToken (XASU) Request (see #Notes).
    /// - `request_title_token` Whether to request a Title Token (see #Notes)
    ///
    /// # Errors
    ///
    /// This method may return an error if any of the intermediate token requests fail.
    /// For a more detailed explanation of the error, refer to the documentation of the
    /// [`crate::XalAuthenticator`] methods.
    ///
    /// # Returns
    ///
    /// This method returns a `Result` containing a tuple with two elements:
    ///
    /// - The updated `XalAuthenticator` instance, with an incremented [`crate::cvlib::CorrelationVector`]
    /// - A `TokenStore` struct, with all the tokens necessary exchanged during the authorization flow.
    ///
    /// # Examples
    ///
    /// ```no_run
    /// use xal::{XalAuthenticator, Flows, CliCallbackHandler, Error, AccessTokenPrefix};
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
    /// // Execute the Xbox Live authorization flow..
    /// let token_store = Flows::xbox_live_authorization_traditional_flow(
    ///     &mut authenticator,
    ///     token_store.live_token,
    ///     "rp://api.minecraftservices.com/".to_string(),
    ///     AccessTokenPrefix::D,
    ///     true,
    /// )
    /// .await?;
    /// # Ok(())
    /// # }
    /// ```
    ///
    /// # Notes
    ///
    /// - Requesting a Title Token *standalone* aka. without sisu-flow only works for very few clients,
    ///   currently only "Minecraft" is known.
    /// - Depending on the client an AccessToken prefix is necessary to have the User Token (XASU) request succeed
    /// - Success of authorizing (device, user, ?title?) tokens for XSTS relies on the target relying party
    pub async fn xbox_live_authorization_traditional_flow(
        authenticator: &mut XalAuthenticator,
        live_tokens: WindowsLiveTokens,
        xsts_relying_party: String,
        access_token_prefix: AccessTokenPrefix,
        request_title_token: bool,
    ) -> Result<TokenStore, Error> {
        debug!("Windows live tokens={:?}", &live_tokens);
        trace!("Getting device token");
        let device_token = authenticator.get_device_token().await?;
        debug!("Device token={:?}", device_token);

        trace!("Getting user token");
        let user_token = authenticator
            .get_user_token(&live_tokens, access_token_prefix)
            .await?;

        debug!("User token={:?}", user_token);

        let maybe_title_token = if request_title_token {
            trace!("Getting title token");
            let title_token = authenticator
                .get_title_token(&live_tokens, &device_token)
                .await?;
            debug!("Title token={:?}", title_token);

            Some(title_token)
        } else {
            debug!("Skipping title token request..");
            None
        };

        trace!("Getting XSTS token");
        let authorization_token = authenticator
            .get_xsts_token(
                Some(&device_token),
                maybe_title_token.as_ref(),
                Some(&user_token),
                &xsts_relying_party,
            )
            .await?;
        debug!("XSTS token={:?}", authorization_token);

        let ts = TokenStore {
            app_params: authenticator.app_params(),
            client_params: authenticator.client_params(),
            sandbox_id: authenticator.sandbox_id(),
            live_token: live_tokens,
            device_token: Some(device_token),
            user_token: Some(user_token),
            title_token: maybe_title_token,
            authorization_token: Some(authorization_token),

            updated: None,
        };

        Ok(ts)
    }

    /// The authorization part of Sisu
    ///
    /// # Examples
    ///
    /// ```no_run
    /// use xal::{XalAuthenticator, Flows, CliCallbackHandler, Error, AccessTokenPrefix};
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
    /// let token_store = Flows::xbox_live_sisu_authorization_flow(
    ///     &mut authenticator,
    ///     token_store.live_token,
    /// )
    /// .await?;
    ///
    /// // TokenStore will contain user/title/device/xsts tokens
    /// assert!(token_store.user_token.is_some());
    /// assert!(token_store.title_token.is_some());
    /// assert!(token_store.device_token.is_some());
    /// assert!(token_store.authorization_token.is_some());
    /// # Ok(())
    /// # }
    /// ```
    pub async fn xbox_live_sisu_authorization_flow(
        authenticator: &mut XalAuthenticator,
        live_tokens: WindowsLiveTokens,
    ) -> Result<TokenStore, Error> {
        debug!("Windows live tokens={:?}", &live_tokens);
        trace!("Getting device token");
        let device_token = authenticator.get_device_token().await?;
        debug!("Device token={:?}", device_token);

        trace!("Getting user token");
        let resp = authenticator
            .sisu_authorize(&live_tokens, &device_token, None)
            .await?;
        debug!("Sisu authorization response");

        let ts = TokenStore {
            app_params: authenticator.app_params(),
            client_params: authenticator.client_params(),
            sandbox_id: authenticator.sandbox_id(),
            live_token: live_tokens,
            device_token: Some(device_token),
            user_token: Some(resp.user_token),
            title_token: Some(resp.title_token),
            authorization_token: Some(resp.authorization_token),

            updated: None,
        };

        Ok(ts)
    }
}
