//! Extensions to reqwest HTTP client library.
//!
//! See the respective trait for implementation examples.
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use cvlib::CorrelationVector;
use http::response::Builder;
use log::{debug, trace};
use reqwest::ResponseBuilderExt;

use crate::auth::error::Error;
use crate::auth::request_signer::{RequestSigner, RequestSigning};

/// Extension to [`reqwest::RequestBuilder`] allowing for verbosely logging the request
///
/// # Examples
///
/// ```
/// use xal::Error;
/// use xal::extensions::LoggingReqwestRequestHandler;
/// use reqwest::Client;
///
/// async fn demo_log_request() -> Result<(), Error> {
///     /* Initialize loglevel */
///     // simple_logger::init_with_level(log::Level::Debug).unwrap();
///
///     // Log the full request to DEBUG-loglevel before sending it
///     let _resp = Client::new()
///         .get("https://example.com")
///         .log()
///         .await?
///         .send()
///         .await?;
///
///     Ok(())
/// }
/// ```
#[async_trait]
pub trait LoggingReqwestRequestHandler {
    /// Log request (debug-loglevel)
    async fn log(self) -> Result<reqwest::RequestBuilder, Error>;
}

#[async_trait]
impl LoggingReqwestRequestHandler for reqwest::RequestBuilder {
    async fn log(self) -> Result<reqwest::RequestBuilder, Error> {
        if let Some(rb) = self.try_clone() {
            let req = rb.build()?;
            let body = match req.body() {
                Some(body) => {
                    let b = body.as_bytes().unwrap();
                    std::str::from_utf8(b)
                }
                None => Ok("<NO BODY>"),
            };

            debug!("[*] Request: {:?}, Body: {:?}", req, body);
        };

        Ok(self)
    }
}

/// Extension to [`reqwest::RequestBuilder`] allowing for verbosely logging the response
///
/// # Examples
///
/// ```
/// use xal::Error;
/// use xal::extensions::LoggingReqwestResponseHandler;
/// use reqwest::Client;
///
/// async fn demo_log_response() -> Result<(), Error> {
///     /* Initialize loglevel */
///     // simple_logger::init_with_level(log::Level::Debug).unwrap();
///
///     // Log the full request to DEBUG-loglevel before sending it
///     let _resp = Client::new()
///         .get("https://example.com")
///         .send()
///         .await?
///         .log()
///         .await?;
///
///     Ok(())
/// }
/// ```
#[async_trait]
pub trait LoggingReqwestResponseHandler {
    /// Log response (debug-loglevel)
    async fn log(self) -> Result<reqwest::Response, Error>;
}

#[async_trait]
impl LoggingReqwestResponseHandler for reqwest::Response {
    async fn log(self) -> Result<reqwest::Response, Error> {
        let mut response_builder = Builder::new()
            .url(self.url().to_owned())
            .status(self.status());

        let headers = self.headers().clone();
        let hdr_mut = response_builder.headers_mut().ok_or(Error::GeneralError(
            "Failed to get mut ref to header".into(),
        ))?;

        headers.into_iter().for_each(|(key, val)| {
            hdr_mut.insert(key.unwrap(), val);
        });

        let new_resp = response_builder.body(self.bytes().await?)?;

        debug!("[*] Response: {:?}", new_resp);

        Ok(reqwest::Response::from(new_resp))
    }
}

/// Extension to [`reqwest::Response`] allowing for returning more-verbose error
/// on deserialization failure
///
/// # Examples
///
/// ```
/// use xal::Error;
/// use xal::extensions::JsonExDeserializeMiddleware;
/// use serde::Deserialize;
/// use reqwest::Client;
///
/// #[derive(Debug, Deserialize)]
/// struct DemoStruct {
///   pub some_key: String,
/// }
///
/// async fn demo_json_deserialize_ex() -> Result<(), Error> {
///     // Return a detailed error in case the JSON Deserialization fails
///     let result = Client::new()
///         .get("https://example.com")
///         .send()
///         .await?
///         .json_ex::<DemoStruct>()
///         .await;
///
///     match result {
///         Err(Error::JsonHttpResponseError{status,url,headers,body,inner}) => {
///             eprintln!(
///                 "Failed deserializing body into struct!
///                  {status:?} {url:?} {headers:?} {body:?} {inner:?}"
///             );
///         },
///         _ => {}
///     };
///
///     Ok(())
/// }
/// ```
#[async_trait]
pub trait JsonExDeserializeMiddleware {
    /// Deserialize JSON response into struct implementing [`serde::de::DeserializeOwned`]
    ///
    /// If response body fails to deserialize, return verbose [`crate::Error`]
    async fn json_ex<T: serde::de::DeserializeOwned>(self) -> Result<T, Error>;
}

#[async_trait]
impl JsonExDeserializeMiddleware for reqwest::Response {
    async fn json_ex<T: serde::de::DeserializeOwned>(self) -> Result<T, Error> {
        let http_status = self.status();
        let url = self.url().to_owned();
        let headers = self.headers().to_owned();

        let full = self.bytes().await?;

        let res = serde_json::from_slice::<T>(&full).map_err(|e| Error::JsonHttpResponseError {
            status: http_status,
            url: url.to_string(),
            headers,
            body: String::from_utf8_lossy(&full).to_string(),
            inner: e,
        });

        res
    }
}

/// Extension to [`reqwest::RequestBuilder`] for signing HTTP requests according to Xbox Live specs
///
/// # Examples
///
/// ```
/// use xal::{RequestSigner, Error};
/// use xal::extensions::SigningReqwestBuilder;
/// use reqwest::Client;
/// use serde_json::json;
///
/// async fn demo_sign_request() -> Result<(), Error> {
///     // Construct request signer
///     let mut request_signer = RequestSigner::new();
///     
///     let response = Client::new()
///         .post("https://example.xboxlive.com")
///         .json(&json!({"some": "value"}))
///         .sign(&mut request_signer, None)
///         .await?
///         .send()
///         .await?;
///
///     Ok(())
/// }
/// ```
#[async_trait]
pub trait SigningReqwestBuilder {
    /// Sign HTTP request for Xbox Live
    async fn sign(
        self,
        signer: &mut RequestSigner,
        timestamp: Option<DateTime<Utc>>,
    ) -> Result<reqwest::RequestBuilder, Error>;
}

#[async_trait]
impl SigningReqwestBuilder for reqwest::RequestBuilder {
    async fn sign(
        self,
        signer: &mut RequestSigner,
        timestamp: Option<DateTime<Utc>>,
    ) -> Result<reqwest::RequestBuilder, Error> {
        match self.try_clone() {
            Some(rb) => {
                let request = rb.build()?;
                // Fallback to Utc::now() internally
                let signed = signer.sign_request(request, timestamp).await?;
                let body_bytes = signed
                    .body()
                    .ok_or(Error::InvalidRequest("Failed getting request body".into()))?
                    .as_bytes()
                    .ok_or(Error::InvalidRequest(
                        "Failed getting bytes from request body".into(),
                    ))?
                    .to_vec();
                let headers = signed.headers().clone();

                Ok(self.headers(headers).body(body_bytes))
            }
            None => Err(Error::InvalidRequest("Failed to clone request".into())),
        }
    }
}

/// Extension to [`reqwest::RequestBuilder`] for adding [`cvlib::CorrelationVector`] to request headers
///
/// # Examples
///
/// ```
/// use xal::Error;
/// use xal::cvlib::CorrelationVector;
/// use xal::extensions::CorrelationVectorReqwestBuilder;
/// use reqwest::Client;
///
/// async fn demo_cv_request() -> Result<(), Error> {
///     // Construct correlation vector
///     let mut cv = CorrelationVector::new();
///     
///     let response = Client::new()
///         .post("https://example.xboxlive.com")
///         .add_cv(&mut cv)?
///         .send()
///         .await?;
///
///     Ok(())
/// }
/// ```
pub trait CorrelationVectorReqwestBuilder {
    /// Add HTTP header `MS-CV` into headers
    fn add_cv(self) -> Result<reqwest::RequestBuilder, Error>;
}

impl CorrelationVectorReqwestBuilder for reqwest::RequestBuilder {
    fn add_cv(self) -> Result<reqwest::RequestBuilder, Error> {
        Ok(self.header("MS-CV", String::from("0")))
    }
}
