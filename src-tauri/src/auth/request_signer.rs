//! Xbox-specific HTTP Request signing.
//!
use crate::auth::error::Error;
use crate::auth::extensions::JsonExDeserializeMiddleware;
use crate::auth::models::SigningPolicy;
use crate::auth::models::response::{self, TitleEndpointsResponse};
use crate::auth::authenticator::Constants;
use crate::auth::models::ProofKey;

use async_trait::async_trait;
use base64ct::{self, Base64, Encoding};
use chrono::prelude::*;
use log::{debug, info, warn};
use nt_time::FileTime;
use p256::{
    ecdsa::{
        signature::hazmat::{PrehashSigner, PrehashVerifier},
        Signature, SigningKey, VerifyingKey,
    },
    SecretKey,
};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    convert::{TryFrom, TryInto},
    option::Option,
    str::FromStr,
};

/// Request signing trait
#[async_trait]
pub trait RequestSigning<Rhs = Self> {
    /// Sign a request
    async fn sign_request(
        &mut self,
        rhs: Rhs,
        timestamp: Option<DateTime<Utc>>,
    ) -> Result<Rhs, Error>;
}

/// Request verification trait
#[async_trait]
pub trait RequestVerification<Rhs = Self> {
    /// Verify a request's signature
    async fn verify(&mut self, rhs: Rhs) -> Result<Rhs, Error>;
}

/// Helper structure which describes the components of a Xbox Live HTTP Signature
/// aka. the base64 value of `Signature` HTTP header
#[derive(Debug)]
struct XboxWebSignatureBytes {
    signing_policy_version: Vec<u8>,
    timestamp: Vec<u8>,
    signature: Signature,
}

impl From<&XboxWebSignatureBytes> for Vec<u8> {
    fn from(obj: &XboxWebSignatureBytes) -> Self {
        let mut bytes: Vec<u8> = Vec::new();
        bytes.extend_from_slice(obj.signing_policy_version.as_slice());
        bytes.extend_from_slice(obj.timestamp.as_slice());
        bytes.extend_from_slice(&obj.signature.to_bytes());

        bytes
    }
}

impl FromStr for XboxWebSignatureBytes {
    type Err = base64ct::Error;

    fn from_str(s: &str) -> std::result::Result<Self, Self::Err> {
        let bytes = Base64::decode_vec(s)?;
        Ok(bytes.into())
    }
}
impl From<Vec<u8>> for XboxWebSignatureBytes {
    fn from(bytes: Vec<u8>) -> Self {
        Self {
            signing_policy_version: bytes[..4].to_vec(),
            timestamp: bytes[4..12].to_vec(),
            signature: Signature::from_slice(&bytes[12..]).unwrap(),
        }
    }
}

impl ToString for XboxWebSignatureBytes {
    fn to_string(&self) -> String {
        let bytes: Vec<u8> = self.into();
        Base64::encode_string(&bytes)
    }
}

/// Wrapper around the parts of a HTTP request which are used to calculate
/// the signature
#[derive(Debug)]
pub struct HttpMessageToSign {
    method: String,
    path_and_query: String,
    authorization: String,
    body: Vec<u8>,
}

impl TryFrom<reqwest::Request> for HttpMessageToSign {
    type Error = Error;

    fn try_from(request: reqwest::Request) -> Result<Self, Self::Error> {
        let url = request.url();

        let method = request.method().to_string().to_uppercase();
        let authorization = match request.headers().get(reqwest::header::AUTHORIZATION) {
            Some(val) => val.to_str().map_err(|_| {
                Error::InvalidRequest(
                    "Failed serializing Authentication header to string".to_string(),
                )
            })?,
            None => "",
        }
        .to_string();

        let body = match *request.method() {
            reqwest::Method::GET => {
                vec![]
            }
            reqwest::Method::POST => request
                .body()
                .ok_or(Error::InvalidRequest(
                    "Failed to get body from HTTP request".to_string(),
                ))?
                .as_bytes()
                .ok_or(Error::InvalidRequest(
                    "Failed to convert HTTP body to bytes".to_string(),
                ))?
                .to_vec(),
            _ => panic!("Unhandled HTTP method: {:?}", request.method()),
        };

        let path_and_query = {
            match url.query() {
                Some(query) => {
                    format!("{}?{query}", url.path())
                }
                None => url.path().to_owned(),
            }
        };

        Ok(HttpMessageToSign {
            method,
            path_and_query,
            authorization,
            body,
        })
    }
}

impl TryFrom<http::Request<Vec<u8>>> for HttpMessageToSign {
    type Error = Error;

    fn try_from(request: http::Request<Vec<u8>>) -> Result<Self, Self::Error> {
        let (parts, body) = request.into_parts();

        let method = parts.method.to_string().to_uppercase();
        let authorization = match parts.headers.get(reqwest::header::AUTHORIZATION) {
            Some(val) => val.to_str().map_err(|_| {
                Error::InvalidRequest(
                    "Failed serializing Authentication header to string".to_string(),
                )
            })?,
            None => "",
        }
        .to_string();

        let path_and_query = parts
            .uri
            .path_and_query()
            .ok_or(Error::InvalidRequest(
                "Failed getting path and query".to_string(),
            ))?
            .to_string();

        Ok(HttpMessageToSign {
            method,
            path_and_query,
            authorization,
            body,
        })
    }
}

/// Request signer
///
/// Calculates the `Signature` header for certain Xbox Live HTTP request
///
/// Use the [`crate::extensions::SigningReqwestBuilder`] for signing HTTP requests more comfortably.
#[derive(Debug, Clone)]
pub struct RequestSigner {
    /// Elliptic curve keypair
    pub keypair: SecretKey,
    /// Signing policy cache
    pub signature_policy_cache: SignaturePolicyCache,
}

impl Default for RequestSigner {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl RequestSigning<reqwest::Request> for RequestSigner {
    async fn sign_request(
        &mut self,
        rhs: reqwest::Request,
        timestamp: Option<DateTime<Utc>>,
    ) -> Result<reqwest::Request, Error> {
        let mut clone_request = rhs.try_clone().unwrap();
        // Gather data from request used for signing
        let to_sign = rhs.try_into()?;

        let signing_policy = self
            .signature_policy_cache
            .find_policy_for_url(clone_request.url().as_str())
            .await?
            .ok_or(Error::GeneralError(
                "No signature policy found for url".into(),
            ))?;

        // Create signature
        let signature = self.sign(
            signing_policy.version,
            timestamp.unwrap_or_else(Utc::now),
            &to_sign,
            signing_policy.max_body_bytes,
        )?;

        // Replace request body with byte representation (so signature creation is deterministic)
        clone_request.body_mut().replace(to_sign.body.into());

        // Assign Signature-header in request
        clone_request
            .headers_mut()
            .insert("Signature", signature.to_string().parse()?);

        Ok(clone_request)
    }
}

#[async_trait]
impl RequestVerification<reqwest::Request> for RequestSigner {
    async fn verify(&mut self, rhs: reqwest::Request) -> Result<reqwest::Request, Error> {
        let request_clone = rhs
            .try_clone()
            .ok_or(Error::InvalidRequest("Failed cloning request".into()))?;

        let signature = request_clone
            .headers()
            .get("Signature")
            .ok_or(Error::InvalidRequest(
                "Failed getting Signature header".into(),
            ))?
            .to_str()
            .map_err(|_e| {
                Error::InvalidRequest("Failed converting Signature header value to str".into())
            })?
            .to_owned();

        let signing_policy = self
            .signature_policy_cache
            .find_policy_for_url(rhs.url().as_str())
            .await?
            .ok_or(Error::GeneralError(
                "No signature policy found for url".into(),
            ))?;

        self.verify_message(
            XboxWebSignatureBytes::from_str(&signature)?,
            &request_clone.try_into()?,
            signing_policy.max_body_bytes,
        )?;

        Ok(rhs)
    }
}

#[async_trait]
impl RequestSigning<http::Request<Vec<u8>>> for RequestSigner {
    async fn sign_request(
        &mut self,
        rhs: http::Request<Vec<u8>>,
        timestamp: Option<DateTime<Utc>>,
    ) -> Result<http::Request<Vec<u8>>, Error> {
        // Gather data from request used for signing
        let (method, uri, mut headers, version, body) = (
            rhs.method().to_owned(),
            rhs.uri().to_owned(),
            rhs.headers().to_owned(),
            rhs.version(),
            rhs.body().clone(),
        );

        let signing_policy = self
            .signature_policy_cache
            .find_policy_for_url(&rhs.uri().to_string())
            .await?
            .ok_or(Error::GeneralError(
                "No signature policy found for url".into(),
            ))?;

        // Create signature
        let signature = self.sign(
            signing_policy.version,
            timestamp.unwrap_or_else(Utc::now),
            &rhs.try_into()?,
            signing_policy.max_body_bytes,
        )?;

        // Assign Signature-header in request
        headers.insert("Signature", signature.to_string().parse()?);

        let mut builder = http::Request::builder()
            .method(method)
            .uri(uri)
            .version(version);
        builder.headers_mut().replace(&mut headers);

        builder.body(body).map_err(std::convert::Into::into)
    }
}

impl RequestSigner {
    /// Creates a new instance of [`RequestSigner`]
    pub fn new() -> Self {
        Self {
            keypair: SecretKey::random(&mut rand::thread_rng()),
            signature_policy_cache: SignaturePolicyCache::default(),
        }
    }

    /// Returns the proof key as JWK
    ///
    /// # Examples
    ///
    /// ```
    /// # use xal::RequestSigner;
    /// let proof_key = RequestSigner::new().get_proof_key();
    /// let proof_key_json = serde_json::to_string(&proof_key);
    /// ```
    pub fn get_proof_key(&self) -> ProofKey {
        ProofKey::new(&self.keypair)
    }

    /// Create signature from parts
    fn sign(
        &self,
        signing_policy_version: i32,
        timestamp: DateTime<Utc>,
        request: &HttpMessageToSign,
        max_body_bytes: usize,
    ) -> Result<XboxWebSignatureBytes, Error> {
        self.sign_raw(
            signing_policy_version,
            timestamp,
            &request.method,
            &request.path_and_query,
            &request.authorization,
            &request.body,
            max_body_bytes,
        )
        .map_err(std::convert::Into::into)
    }

    /// Create signature from low-level parts
    #[allow(clippy::too_many_arguments)]
    fn sign_raw(
        &self,
        signing_policy_version: i32,
        timestamp: DateTime<Utc>,
        method: &str,
        path_and_query: &str,
        authorization: &str,
        body: &[u8],
        max_body_bytes: usize,
    ) -> Result<XboxWebSignatureBytes, Error> {
        let signing_key: SigningKey = self.keypair.clone().into();

        let filetime_bytes = FileTime::try_from(timestamp)
            .map_err(|e| Error::GeneralError(format!("{e}")))?
            .to_be_bytes();
        let signing_policy_version_bytes = signing_policy_version.to_be_bytes();

        // Assemble the message to sign
        let prehash = RequestSigner::prehash_message_data(
            &signing_policy_version_bytes,
            &filetime_bytes,
            method,
            path_and_query,
            authorization,
            body,
            max_body_bytes,
        );

        // Sign the message
        let signature: Signature = signing_key.sign_prehash(&prehash).unwrap();

        // Return final signature
        Ok(XboxWebSignatureBytes {
            signing_policy_version: signing_policy_version_bytes.to_vec(),
            timestamp: filetime_bytes.to_vec(),
            signature,
        })
    }

    /// Verify the signature of a HTTP request (lower level)
    fn verify_message(
        &self,
        signature: XboxWebSignatureBytes,
        request: &HttpMessageToSign,
        max_body_bytes: usize,
    ) -> Result<(), Error> {
        let verifier: VerifyingKey = self.keypair.public_key().into();

        // Assemble the message to sign
        let prehash = RequestSigner::prehash_message_data(
            &signature.signing_policy_version,
            &signature.timestamp,
            &request.method,
            &request.path_and_query,
            &request.authorization,
            &request.body,
            max_body_bytes,
        );

        verifier
            .verify_prehash(&prehash, &signature.signature)
            .map_err(std::convert::Into::into)
    }

    /// Helper function to assemble the to-be-signed data
    #[allow(clippy::too_many_arguments)]
    pub fn prehash_message_data(
        signing_policy_version: &[u8],
        timestamp: &[u8],
        method: &str,
        path_and_query: &str,
        authorization: &str,
        body: &[u8],
        max_body_bytes: usize,
    ) -> Vec<u8> {
        const NULL_BYTE: &[u8; 1] = &[0x00];

        let mut hasher = Sha256::new();

        // Signature version + null
        hasher.update(signing_policy_version);
        hasher.update(NULL_BYTE);

        // Timestamp + null
        hasher.update(timestamp);
        hasher.update(NULL_BYTE);

        // Method (uppercase) + null
        hasher.update(method.to_uppercase().as_bytes());
        hasher.update(NULL_BYTE);

        // Path and query + null
        hasher.update(path_and_query.as_bytes());
        hasher.update(NULL_BYTE);

        // Authorization (even if an empty string)
        hasher.update(authorization.as_bytes());
        hasher.update(NULL_BYTE);

        // Body
        let body_size_to_hash = std::cmp::min(max_body_bytes, body.len());
        hasher.update(&body[..body_size_to_hash]);
        hasher.update(NULL_BYTE);

        hasher.finalize().to_vec()
    }
}

/// Get Xbox Live endpoint descriptions required for dynamically signing HTTP requests
/// based on target domain / endpoint
///
/// Can be used to instantiate [`SignaturePolicyCache`].
pub async fn get_endpoints() -> Result<response::TitleEndpointsResponse, Error> {
    let resp = reqwest::Client::new()
        .get(Constants::XBOX_TITLE_ENDPOINTS_URL)
        .header("x-xbl-contract-version", "1")
        .query(&[("type", 1)])
        .send()
        .await?
        .json_ex::<response::TitleEndpointsResponse>()
        .await?;

    Ok(resp)
}

/// Signature policy cache
///
///
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct SignaturePolicyCache {
    endpoints: Option<TitleEndpointsResponse>,
}

impl SignaturePolicyCache {
    /// Create a new SignaturePolicyCache.
    ///
    /// # Examples
    ///
    /// ```
    /// use xal::{SignaturePolicyCache, get_endpoints};
    ///
    /// # tokio_test::block_on(async {
    /// let endpoints = get_endpoints().await.unwrap();
    /// let policy_cache = SignaturePolicyCache::new(endpoints);
    /// # })
    /// ```
    pub fn new(endpoints: TitleEndpointsResponse) -> Self {
        Self {
            endpoints: Some(endpoints),
        }
    }

    /// Retrieve the stored TitleEndpointsResponse.
    pub fn get_endpoints(&self) -> Option<TitleEndpointsResponse> {
        self.endpoints.clone()
    }

    /// Find the policy for the given URL.
    ///
    /// If a matching policy is found, returns the corresponding SigningPolicy. Otherwise, returns None.
    ///
    /// # Examples
    ///
    /// ```
    /// # use xal::SignaturePolicyCache;
    /// # tokio_test::block_on(async {
    /// let mut policy_cache = SignaturePolicyCache::default();
    /// # let endpoints = serde_json::from_str(include_str!("../testdata/title_endpoints.json")).unwrap();
    /// # let mut policy_cache = SignaturePolicyCache::new(endpoints);
    ///
    /// let policy = policy_cache.find_policy_for_url("https://example.xboxlive.com")
    ///     .await
    ///     .unwrap();
    /// assert!(policy.is_some());
    ///
    /// let policy_not_found = policy_cache.find_policy_for_url("https://example.com")
    ///     .await
    ///     .unwrap();
    /// assert!(policy_not_found.is_none());
    /// # })
    /// ```
    pub async fn find_policy_for_url(&mut self, url: &str) -> Result<Option<SigningPolicy>, Error> {
        let url = url::Url::parse(url)?;

        if !["http", "https"].contains(&url.scheme()) {
            return Err(Error::GeneralError(format!(
                "Url with invalid protocol passed, expected http or https, url={url}"
            )));
        }

        let endpoints = match self.endpoints.as_ref() {
            Some(eps) => eps.to_owned(),
            None => {
                info!("No cached TitleEndpoints found, attempting download of new copy");
                let eps = get_endpoints().await?;
                self.endpoints = Some(eps.clone());
                eps
            }
        };

        let matching_endpoint = endpoints
            .end_points
            .iter()
            .filter(|e| {
                e.protocol.eq_ignore_ascii_case(url.scheme())
                    && url
                        .host_str()
                        .map(|host| match e.host_type.as_str() {
                            "fqdn" => host == e.host,
                            "wildcard" => host.ends_with(e.host.trim_start_matches('*')),
                            _ => false,
                        })
                        .unwrap_or(false)
                    && e.path
                        .as_ref()
                        .map(|path| url.path() == path)
                        .unwrap_or(true)
                    && e.signature_policy_index.is_some()
            })
            .max_by_key(|e| e.host.len());

        match matching_endpoint {
            Some(ep) => {
                debug!("Identified Title endpoint={ep:?} for URL={url} {url:?}");
                let policy_index = ep.signature_policy_index.unwrap() as usize;
                let policy =
                    endpoints
                        .signature_policies
                        .get(policy_index)
                        .ok_or(Error::GeneralError(format!(
                            "SignaturePolicy at index {policy_index} not found!"
                        )))?;

                Ok(Some(policy.to_owned()))
            }
            None => {
                warn!("No matched SigningPolicy for url={url:?} found");
                Ok(None)
            }
        }
    }
}