//! HTTP Request and Response models and XAL related constants.
use std::str::FromStr;

use base64ct::Encoding;

use oauth2::{RedirectUrl, Scope};
use p256::elliptic_curve::sec1::ToEncodedPoint;
use p256::SecretKey;

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// ProofKey model
#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub struct ProofKey {
    alg: String,
    crv: String,
    kty: String,
    #[serde(rename = "use")]
    u: String,
    x: String,
    y: String,
}

impl ProofKey {
    /// Create new instance of proof key
    ///
    /// # Examples
    ///
    /// ```
    /// use xal::ProofKey;
    /// use p256::SecretKey;
    ///
    /// let secret_key = SecretKey::random(&mut rand::thread_rng());
    /// let proof_key = ProofKey::new(&secret_key);
    ///
    /// let serialized = serde_json::to_string(&proof_key).unwrap();
    /// println!("{serialized}");
    /// ```
    pub fn new(key: &SecretKey) -> Self {
        let point = key.public_key().to_encoded_point(false);
        Self {
            crv: "P-256".into(),
            alg: "ES256".into(),
            u: "sig".into(),
            kty: "EC".into(),
            x: base64ct::Base64UrlUnpadded::encode_string(point.x().unwrap().as_slice()),
            y: base64ct::Base64UrlUnpadded::encode_string(point.y().unwrap().as_slice()),
        }
    }
}

/// Supported signing algorithms for HTTP request signing
///
/// Utilized by [`SigningPolicy`]
#[derive(Debug, Serialize, Deserialize, Copy, Clone, PartialEq, Eq)]
pub enum SigningAlgorithm {
    /// Elliptic curve DSA with SHA256
    ES256,
    /// Elliptic curve DSA with SHA384
    ES384,
    /// Elliptic curve DSA with SHA521
    ES521,
}

/// Signing policy for HTTP request signing
///
/// Info about used policy for domains / endpoints can be requested
/// via [`crate::request_signer::get_endpoints`].
///
/// Utilized by [`crate::RequestSigner`]
#[derive(Debug, PartialEq, Eq, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct SigningPolicy {
    /// Signing policy version
    pub version: i32,
    /// List of supported signing algorithms
    pub supported_algorithms: Vec<SigningAlgorithm>,
    /// Maximum body bytes to consider for signing
    pub max_body_bytes: usize,
}

impl Default for SigningPolicy {
    fn default() -> Self {
        Self {
            version: 1,
            supported_algorithms: vec![SigningAlgorithm::ES256],
            max_body_bytes: 8192,
        }
    }
}

/// HTTP Request models
pub mod request {
    use super::{Deserialize, ProofKey, Serialize};

    /// SISU query node
    ///
    /// Subnode of [`SisuAuthenticationRequest`] request body.
    #[derive(Debug, Serialize, Deserialize)]
    pub struct SisuQuery<'a> {
        /// Display parameter
        pub display: &'a str,
        /// OAuth2 code challenge
        pub code_challenge: &'a str,
        /// OAuth2 code challenge method
        pub code_challenge_method: &'a str,
        /// OAuth2 state
        pub state: &'a str,
    }

    /// SISU Authentication request body
    ///
    /// Used by [`crate::XalAuthenticator::sisu_authenticate`]
    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "PascalCase")]
    pub struct SisuAuthenticationRequest<'a> {
        /// Application Id - see [`crate::XalAppParameters`]
        pub app_id: &'a str,
        /// Title Id - see [`crate::XalAppParameters`]
        pub title_id: &'a str,
        /// Redirect Uri - see [`crate::XalAppParameters`]
        pub redirect_uri: &'a str,
        /// Device token
        pub device_token: &'a str,
        /// Target Xbox Live sandbox
        pub sandbox: &'a str,
        /// Token type
        pub token_type: &'a str,
        /// Offers - Defines desired authorization scopes
        pub offers: Vec<&'a str>,
        /// Query
        pub query: SisuQuery<'a>,
    }

    /// SISU Authorization request body
    ///
    /// Used by [`crate::XalAuthenticator::sisu_authorize`]
    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "PascalCase")]
    pub struct SisuAuthorizationRequest<'a> {
        /// Access token
        pub access_token: &'a str,
        /// App Id - see [`crate::XalAppParameters`]
        pub app_id: &'a str,
        /// Device token
        pub device_token: &'a str,
        /// Target Xbox Live sandbox
        pub sandbox: &'a str,
        /// Site name
        pub site_name: &'a str,
        /// Session Id
        ///
        /// Received by previous call on [`crate::XalAuthenticator::sisu_authenticate`]
        #[serde(skip_serializing_if = "Option::is_none")]
        pub session_id: Option<String>,
        /// JWK proof key, related to HTTP request signing
        ///
        /// Can be obtained from an instance of [`crate::RequestSigner`]
        pub proof_key: ProofKey,
    }

    /// Xbox Authentication Device Properties
    ///
    /// Subtype of [`XTokenRequest`] request body.
    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "PascalCase")]
    pub struct XADProperties<'a> {
        /// Authentication method, usually "JWT"
        pub auth_method: &'a str,
        /// Client UUID (can be random for Win32/Android/iOS client)
        pub id: &'a str,
        /// Device type - String representation of [`crate::DeviceType`]
        pub device_type: &'a str,
        /// Version of client OS
        pub version: &'a str,
        /// JWK proof key, related to HTTP request signing
        ///
        /// Can be obtained from an instance of [`crate::RequestSigner`]
        pub proof_key: ProofKey,
    }

    /// Xbox Authentication Title Properties
    ///
    /// Subtype of [`XTokenRequest`] request body.
    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "PascalCase")]
    pub struct XASTProperties<'a> {
        /// Authentication method, usually "RPS"
        pub auth_method: &'a str,
        /// Device token
        pub device_token: &'a str,
        /// Site name, usually: "user.auth.xboxlive.com"
        pub site_name: &'a str,
        /// RPS Ticket
        pub rps_ticket: &'a str,
    }

    /// Xbox Authentication User Properties
    ///
    /// Subtype of [`XTokenRequest`] request body.
    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "PascalCase")]
    pub struct XASUProperties<'a> {
        /// Authentication method, usually "RPS"
        pub auth_method: &'a str,
        /// Site name, usually: "user.auth.xboxlive.com"
        pub site_name: &'a str,
        /// RPS Ticket
        pub rps_ticket: &'a str,
    }

    /// XSTS Token request properties
    ///
    /// Subtype of [`XTokenRequest`] request body.
    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "PascalCase")]
    pub struct XSTSProperties<'a> {
        /// Target Xbox Live sandbox
        pub sandbox_id: &'a str,
        /// Device Token
        #[serde(skip_serializing_if = "Option::is_none")]
        pub device_token: Option<&'a str>,
        /// Title Token
        #[serde(skip_serializing_if = "Option::is_none")]
        pub title_token: Option<&'a str>,
        /// List of User tokens
        #[serde(skip_serializing_if = "Vec::is_empty")]
        pub user_tokens: Vec<&'a str>,
    }

    /// XToken request body
    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "PascalCase")]
    pub struct XTokenRequest<'a, T> {
        /// Relying party
        pub relying_party: &'a str,
        /// Token type
        pub token_type: &'a str,
        /// XSTS Properties
        pub properties: T,
    }
}

/// HTTP Response models
pub mod response {
    use chrono::{DateTime, TimeZone, Utc};
    use oauth2::basic::BasicTokenResponse;
    use url::Url;

    // use crate::Error;
    use crate::auth::error::Error;

    use super::{Deserialize, HashMap, Serialize, SigningPolicy};

    /// Alias type for Windows Live token response
    pub type WindowsLiveTokens = BasicTokenResponse;
    /// Shorthand type for Token response with Device-DisplayClaims
    pub type DeviceToken = XTokenResponse<XADDisplayClaims>;
    /// Shorthand type for Token response with User-DisplayClaims
    pub type UserToken = XTokenResponse<XAUDisplayClaims>;
    /// Shorthand type for Token response with Title-DisplayClaims
    pub type TitleToken = XTokenResponse<XATDisplayClaims>;
    /// Shorthand type for Token response with XSTS-DisplayClaims
    pub type XSTSToken = XTokenResponse<XSTSDisplayClaims>;

    /// Device Token Display claims
    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct XADDisplayClaims {
        /// Contains shorthand identifiers about Device Token claims
        ///
        /// e.g. `{"xdi": {"did": "F.....", "dcs": "0"}}`
        pub xdi: HashMap<String, String>,
    }

    /// Title display claims
    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct XATDisplayClaims {
        /// Title identity
        pub xti: HashMap<String, String>,
    }

    /// User display claims
    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct XAUDisplayClaims {
        /// Xbox user identity
        pub xui: Vec<HashMap<String, String>>,
    }

    /// XSTS display claims
    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct XSTSDisplayClaims {
        /// Xui
        pub xui: Vec<HashMap<String, String>>,
    }

    /// XSTS Token response
    #[derive(Debug, Serialize, Deserialize, Clone)]
    #[serde(rename_all = "PascalCase")]
    pub struct XTokenResponse<T> {
        /// Issue datetime of token
        pub issue_instant: DateTime<Utc>,
        /// Expiry datetime of token
        pub not_after: DateTime<Utc>,
        /// Token value
        pub token: String,
        /// XSTS display claims
        pub display_claims: Option<T>,
    }

    impl XTokenResponse<XSTSDisplayClaims> {
        /// Return Xbox Userhash (related to `Authorization`)
        #[must_use]
        pub fn userhash(&self) -> String {
            self.display_claims.clone().unwrap().xui[0]["uhs"].clone()
        }

        /// Return Authorization header value
        #[must_use]
        pub fn authorization_header_value(&self) -> String {
            format!("XBL3.0 x={};{}", self.userhash(), self.token)
        }
    }

    impl<T> From<&str> for XTokenResponse<T> {
        fn from(s: &str) -> Self {
            Self {
                issue_instant: Utc.with_ymd_and_hms(2020, 12, 15, 0, 0, 0).unwrap(),
                not_after: Utc.with_ymd_and_hms(2199, 12, 15, 0, 0, 0).unwrap(),
                token: s.to_owned(),
                display_claims: None,
            }
        }
    }

    impl<T> XTokenResponse<T> {
        /// Check if token is valid
        pub fn check_validity(&self) -> Result<(), Error> {
            if self.not_after < chrono::offset::Utc::now() {
                return Err(Error::TokenExpired(self.not_after));
            }

            Ok(())
        }
    }

    /// Sisu authentication repsonse
    #[derive(Debug, Serialize, Deserialize, Clone)]
    #[serde(rename_all = "PascalCase")]
    pub struct SisuAuthenticationResponse {
        /// OAuth2 redirection URL
        pub msa_oauth_redirect: Url,
        /// Request parameters
        pub msa_request_parameters: HashMap<String, String>,
    }

    /// Sisu authorization response
    #[derive(Debug, Serialize, Deserialize, Clone)]
    #[serde(rename_all = "PascalCase")]
    pub struct SisuAuthorizationResponse {
        /// Device Token
        pub device_token: String,
        /// Title Token
        pub title_token: TitleToken,
        /// User Token
        pub user_token: UserToken,
        /// Authorization Token
        pub authorization_token: XSTSToken,
        /// Web page
        pub web_page: String,
        /// Xbox Live sandbox
        pub sandbox: String,
        /// Modern gamertag indication
        pub use_modern_gamertag: Option<bool>,
    }

    /// Title endpoint certificate
    #[derive(Debug, Eq, PartialEq, Serialize, Deserialize, Clone)]
    #[serde(rename_all = "PascalCase")]
    pub struct TitleEndpointCertificate {
        /// Certificate thumb-/fingerprint
        pub thumbprint: String,
        /// Whether an issuer cert
        pub is_issuer: Option<bool>,
        /// Root certificate index
        pub root_cert_index: i32,
    }

    /// Title endpoint
    #[derive(Debug, Eq, PartialEq, Serialize, Deserialize, Clone)]
    #[serde(rename_all = "PascalCase")]
    pub struct TitleEndpoint {
        /// Protocol
        pub protocol: String,
        /// Host
        pub host: String,
        /// Host type
        pub host_type: String,
        /// Path
        pub path: Option<String>,
        /// Relying party
        pub relying_party: Option<String>,
        /// Sub relying party
        pub sub_relying_party: Option<String>,
        /// Token type
        pub token_type: Option<String>,
        /// Signature policy index
        pub signature_policy_index: Option<i32>,
        /// Server cert index
        pub server_cert_index: Option<Vec<i32>>,
    }

    /// Title Endpoints response
    ///
    /// Can be fetched via [`crate::XalAuthenticator`]
    #[derive(Debug, Eq, PartialEq, Serialize, Deserialize, Clone)]
    #[serde(rename_all = "PascalCase")]
    pub struct TitleEndpointsResponse {
        /// Collection of available endpoints
        pub end_points: Vec<TitleEndpoint>,
        /// Collection of signing policies
        pub signature_policies: Vec<SigningPolicy>,
        /// Collection of title endpoint certificates
        pub certs: Vec<TitleEndpointCertificate>,
        /// List of root certificates
        pub root_certs: Vec<String>,
    }

    /// Wrapper for sisu session id
    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct SisuSessionId(pub String);
}

/// Access Token prefix
///
/// Relevant for fetching the UserToken
///
/// Exact conditions are still unknown, when to use which format.
#[derive(Debug, Eq, PartialEq, Clone)]
pub enum AccessTokenPrefix {
    /// Prefix access token with "d="
    D,
    /// Prefix access token with "t="
    T,
    /// Use token string as-is
    None,
}

impl ToString for AccessTokenPrefix {
    fn to_string(&self) -> String {
        let prefix = match self {
            AccessTokenPrefix::D => "d=",
            AccessTokenPrefix::T => "t=",
            AccessTokenPrefix::None => "",
        };

        prefix.to_string()
    }
}

/// Device type
#[derive(Debug, Serialize, Deserialize, Eq, PartialEq, Clone)]
pub enum DeviceType {
    /// iOS (iPhone or iPad)
    IOS,
    /// Google Android
    ANDROID,
    /// Microsoft Windows
    WIN32,
    /// Nintendo Switch
    NINTENDO,
    /// Custom type (user-defined)
    Custom(String),
}

impl FromStr for DeviceType {
    type Err = Box<dyn std::error::Error>;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let enm = match s.to_lowercase().as_ref() {
            "android" => DeviceType::ANDROID,
            "ios" => DeviceType::IOS,
            "win32" => DeviceType::WIN32,
            "nintendo" => DeviceType::NINTENDO,
            val => DeviceType::Custom(val.to_owned()),
        };
        Ok(enm)
    }
}

impl ToString for DeviceType {
    fn to_string(&self) -> String {
        let str = match self {
            DeviceType::ANDROID => "Android",
            DeviceType::IOS => "iOS",
            DeviceType::WIN32 => "Win32",
            DeviceType::NINTENDO => "Nintendo",
            DeviceType::Custom(val) => val,
        };
        str.to_owned()
    }
}

/// XAL App parameters
///
/// Mandatory for XAL authentication flow
#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Clone)]
pub struct XalAppParameters {
    /// OAuth2 Client Id
    pub client_id: String,
    /// App Title-Id (Required for SISU auth flow, for TitleToken)
    pub title_id: Option<String>,
    /// Scopes
    pub auth_scopes: Vec<Scope>,
    /// Redirect Uri (For OAuth2 code response)
    pub redirect_uri: Option<RedirectUrl>,
    /// OAuth2 Client Secret
    pub client_secret: Option<String>,
}

/// Application parameter constants
///
/// Used for instantiating [`crate::XalAuthenticator`]
///
/// # Examples
///
/// ```
/// use xal::{XalAuthenticator, XalClientParameters, app_params};
///
/// let mut authenticator = XalAuthenticator::new(
///     app_params::APP_GAMEPASS_BETA(),
///     XalClientParameters::default(),
///     "RETAIL".into()
/// );
///
/// assert_eq!(authenticator.app_params(), app_params::APP_GAMEPASS_BETA());
/// assert_ne!(authenticator.app_params(), app_params::APP_XBOX_BETA());
/// ```
#[allow(non_snake_case)]
pub mod app_params {
    use oauth2::{RedirectUrl, Scope};

    use super::XalAppParameters;
    use crate::auth::authenticator::Constants;

    /// Xbox Beta App
    pub fn APP_XBOX_BETA() -> XalAppParameters {
        XalAppParameters {
            client_id: "000000004415494b".into(),
            title_id: Some("177887386".into()),
            auth_scopes: vec![Scope::new(Constants::SCOPE_SERVICE_USER_AUTH.to_string())],
            // Originally "ms-xal-000000004415494b://auth"
            redirect_uri: Some(
                RedirectUrl::new(Constants::OAUTH20_DESKTOP_REDIRECT_URL.into()).unwrap(),
            ),
            client_secret: None,
        }
    }

    /// Xbox App
    pub fn APP_XBOX() -> XalAppParameters {
        XalAppParameters {
            client_id: "000000004c12ae6f".into(),
            title_id: Some("328178078".into()),
            auth_scopes: vec![Scope::new(Constants::SCOPE_SERVICE_USER_AUTH.to_string())],
            // Originally "ms-xal-000000004c12ae6f://auth"
            redirect_uri: Some(
                RedirectUrl::new(Constants::OAUTH20_DESKTOP_REDIRECT_URL.into()).unwrap(),
            ),
            client_secret: None,
        }
    }

    /// Gamepass App
    pub fn APP_GAMEPASS() -> XalAppParameters {
        XalAppParameters {
            client_id: "000000004c20a908".into(),
            title_id: Some("1016898439".into()),
            auth_scopes: vec![Scope::new(Constants::SCOPE_SERVICE_USER_AUTH.to_string())],
            // Originally "ms-xal-000000004c20a908://auth"
            redirect_uri: Some(
                RedirectUrl::new(Constants::OAUTH20_DESKTOP_REDIRECT_URL.into()).unwrap(),
            ),
            client_secret: None,
        }
    }

    /// Gamepass Beta App
    pub fn APP_GAMEPASS_BETA() -> XalAppParameters {
        XalAppParameters {
            client_id: "000000004c20a908".into(),
            title_id: Some("1016898439".into()),
            auth_scopes: vec![Scope::new(Constants::SCOPE_SERVICE_USER_AUTH.to_string())],
            // Originally "ms-xal-public-beta-000000004c20a908://auth"
            redirect_uri: Some(
                RedirectUrl::new(Constants::OAUTH20_DESKTOP_REDIRECT_URL.into()).unwrap(),
            ),
            client_secret: None,
        }
    }

    /// Family Settings App
    ///
    /// Uses default `oauth20_desktop.srf` redirect uri
    pub fn APP_FAMILY_SETTINGS() -> XalAppParameters {
        XalAppParameters {
            client_id: "00000000482C8F49".into(),
            title_id: Some("1618633878".into()),
            auth_scopes: vec![Scope::new(Constants::SCOPE_SERVICE_USER_AUTH.to_string())],
            redirect_uri: Some(
                RedirectUrl::new(Constants::OAUTH20_DESKTOP_REDIRECT_URL.into()).unwrap(),
            ),
            client_secret: None,
        }
    }

    /// Old Xbox App (non-sisu-flow)
    pub fn APP_OLD_XBOX_APP() -> XalAppParameters {
        XalAppParameters {
            client_id: "0000000048093EE3".into(),
            title_id: None,
            auth_scopes: vec![Scope::new(Constants::SCOPE_SERVICE_USER_AUTH.to_string())],
            redirect_uri: Some(
                RedirectUrl::new(Constants::OAUTH20_DESKTOP_REDIRECT_URL.into()).unwrap(),
            ),
            client_secret: None,
        }
    }

    /// Minecraft for Windows (JAVA)
    pub fn MC_JAVA_WIN32() -> XalAppParameters {
        XalAppParameters {
            client_id: "00000000402b5328".into(),
            title_id: None,
            auth_scopes: vec![Scope::new(Constants::SCOPE_SERVICE_USER_AUTH.to_string())],
            redirect_uri: Some(
                RedirectUrl::new(Constants::OAUTH20_DESKTOP_REDIRECT_URL.into()).unwrap(),
            ),
            client_secret: None,
        }
    }

    /// Minecraft Bedrock (Nintendo Switch)
    pub fn MC_BEDROCK_SWITCH() -> XalAppParameters {
        XalAppParameters {
            client_id: "00000000441cc96b".into(),
            title_id: Some("2047319603".into()),
            auth_scopes: vec![Scope::new(Constants::SCOPE_SERVICE_USER_AUTH.to_string())],
            redirect_uri: Some(
                RedirectUrl::new(Constants::OAUTH20_DESKTOP_REDIRECT_URL.into()).unwrap(),
            ),
            client_secret: None,
        }
    }

    /// Minecraft Bedrock (Android)
    pub fn MC_BEDROCK_ANDROID() -> XalAppParameters {
        XalAppParameters {
            client_id: "0000000048183522".into(),
            title_id: Some("1739947436".into()),
            auth_scopes: vec![Scope::new(Constants::SCOPE_SERVICE_USER_AUTH.to_string())],
            redirect_uri: Some(
                RedirectUrl::new(Constants::OAUTH20_DESKTOP_REDIRECT_URL.into()).unwrap(),
            ),
            client_secret: None,
        }
    }

    /// Minecraft Bedrock (iOS)
    pub fn MC_BEDROCK_IOS() -> XalAppParameters {
        XalAppParameters {
            client_id: "000000004c17c01a".into(),
            title_id: Some("1810924247".into()),
            auth_scopes: vec![Scope::new(Constants::SCOPE_SERVICE_USER_AUTH.to_string())],
            redirect_uri: Some(
                RedirectUrl::new(Constants::OAUTH20_DESKTOP_REDIRECT_URL.into()).unwrap(),
            ),
            client_secret: None,
        }
    }

    /*
    /// Minecraft Bedrock (Win32))
    pub const MC_BEDROCK_WIN32: XalAppParameters = XalAppParameters {
        client_id: "".into(),
        title_id: "896928775".into(),
        auth_scopes: vec![Scope::new(Constants::SCOPE_SERVICE_USER_AUTH.to_string())],
        redirect_uri: None,
    };

    pub const MC_BEDROCK_PLAYSTATION: XalAppParameters = XalAppParameters {
        client_id: "".into(),
        title_id: "2044456598".into(),
        auth_scopes: vec![Scope::new(Constants::SCOPE_SERVICE_USER_AUTH.to_string())],
        redirect_uri: None,
    };
    */
}

impl Default for XalAppParameters {
    fn default() -> Self {
        app_params::APP_GAMEPASS_BETA()
    }
}

/// XAL Client parameters
///
/// Metadata from the client which attempts authentication
#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Clone)]
pub struct XalClientParameters {
    /// HTTP User Agent
    pub user_agent: String,
    /// Device type
    pub device_type: DeviceType,
    /// Software version (aka. OS version)
    pub client_version: String,
    /// Query display parameter (for webinterface rendering of OAuth page)
    pub query_display: String,
}

/// Client parameter constants
///
/// Used for instantiating [`crate::XalAuthenticator`]
///
///
/// # Examples
///
/// ```
/// use xal::{XalAuthenticator, XalAppParameters, client_params};
///
/// let mut authenticator = XalAuthenticator::new(
///     XalAppParameters::default(),
///     client_params::CLIENT_ANDROID(),
///     "RETAIL".into()
/// );
///
/// assert_eq!(authenticator.client_params(), client_params::CLIENT_ANDROID());
/// assert_ne!(authenticator.client_params(), client_params::CLIENT_IOS());
/// ```
#[allow(non_snake_case)]
pub mod client_params {
    use super::{DeviceType, XalClientParameters};

    /// iOS Client (iPhone or iPad)
    pub fn CLIENT_IOS() -> XalClientParameters {
        XalClientParameters {
            user_agent: "XAL iOS 2021.11.20211021.000".into(),
            device_type: DeviceType::IOS,
            client_version: "15.6.1".into(),
            query_display: "ios_phone".into(),
        }
    }

    /// Android Client
    pub fn CLIENT_ANDROID() -> XalClientParameters {
        XalClientParameters {
            user_agent: "XAL Android 2020.07.20200714.000".into(),
            device_type: DeviceType::ANDROID,
            client_version: "8.0.0".into(),
            query_display: "android_phone".into(),
        }
    }

    /// Nintendo Switch Client
    pub fn CLIENT_NINTENDO() -> XalClientParameters {
        XalClientParameters {
            user_agent: "XAL".into(),
            device_type: DeviceType::NINTENDO,
            client_version: "0.0.0".into(),
            query_display: "touch".into(),
        }
    }
}

impl Default for XalClientParameters {
    fn default() -> Self {
        client_params::CLIENT_ANDROID()
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn deserialize_xsts() {
        let data = r#"
        {
            "IssueInstant": "2010-10-10T03:06:35.5251155Z",
            "NotAfter": "2999-10-10T19:06:35.5251155Z",
            "Token": "123456789",
            "DisplayClaims": {
              "xui": [
                {
                  "gtg": "e",
                  "xid": "2669321029139235",
                  "uhs": "abcdefg",
                  "agg": "Adult",
                  "usr": "",
                  "utr": "",
                  "prv": ""
                }
              ]
            }
        }
        "#;

        let xsts: response::XSTSToken =
            serde_json::from_str(data).expect("BUG: Failed to deserialize XSTS response");

        assert_eq!(xsts.userhash(), "abcdefg");
        assert_eq!(
            xsts.authorization_header_value(),
            "XBL3.0 x=abcdefg;123456789"
        );
        assert_eq!(xsts.token, "123456789".to_owned());
        assert_eq!(
            xsts.display_claims.as_ref().unwrap().xui[0].get("gtg"),
            Some(&"e".to_owned())
        );
        assert_ne!(
            xsts.display_claims.as_ref().unwrap().xui[0].get("uhs"),
            Some(&"invalid".to_owned())
        );
    }

    #[test]
    fn deserialize_signing_policy() {
        let json_resp = r#"{
            "Version": 99,
            "SupportedAlgorithms": ["ES521"],
            "MaxBodyBytes": 1234
        }"#;

        let deserialized: SigningPolicy =
            serde_json::from_str(json_resp).expect("Failed to deserialize SigningPolicy");

        assert_eq!(deserialized.version, 99);
        assert_eq!(deserialized.max_body_bytes, 1234);
        assert_eq!(
            deserialized.supported_algorithms,
            vec![SigningAlgorithm::ES521]
        )
    }

    #[test]
    fn devicetype_enum_into() {
        assert_eq!(DeviceType::WIN32.to_string(), "Win32");
        assert_eq!(DeviceType::ANDROID.to_string(), "Android");
        assert_eq!(DeviceType::IOS.to_string(), "iOS");
        assert_eq!(DeviceType::NINTENDO.to_string(), "Nintendo");
    }

    #[test]
    fn str_into_devicetype_enum() {
        assert_eq!(DeviceType::from_str("win32").unwrap(), DeviceType::WIN32);
        assert_eq!(DeviceType::from_str("Win32").unwrap(), DeviceType::WIN32);
        assert_eq!(DeviceType::from_str("WIN32").unwrap(), DeviceType::WIN32);
        assert_eq!(
            DeviceType::from_str("android").unwrap(),
            DeviceType::ANDROID
        );
        assert_eq!(DeviceType::from_str("ios").unwrap(), DeviceType::IOS);
        assert_eq!(
            DeviceType::from_str("nintendo").unwrap(),
            DeviceType::NINTENDO
        );
        assert_eq!(
            DeviceType::from_str("androidx").unwrap(),
            DeviceType::Custom("androidx".into())
        );
    }
}
