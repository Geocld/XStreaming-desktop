//! Definition of custom error type.
//!

use chrono::{DateTime, Utc};
use oauth2::{
    basic::BasicErrorResponse, reqwest::AsyncHttpClientError, DeviceCodeErrorResponse,
    RequestTokenError,
};
use reqwest::header::InvalidHeaderValue;
use thiserror::Error;
use url::ParseError;

/// Custom Error type
#[derive(Error, Debug)]
pub enum Error {
    /// URL failed parsing
    #[error("Url parsing failed")]
    UrlParseError(#[from] ParseError),
    /// OAuth2 failed
    #[error("Failed executing oauth request")]
    OAuthExecutionError(#[from] RequestTokenError<AsyncHttpClientError, BasicErrorResponse>),
    /// OAuth2 device code flow failed
    #[error("Failed executing oauth request")]
    OAuthDeviceCodeError(#[from] RequestTokenError<AsyncHttpClientError, DeviceCodeErrorResponse>),
    /// Generic Reqwest HTTP client error
    #[error("Reqwest error")]
    ReqwestError(#[from] reqwest::Error),
    /// Generic HTTP error
    #[error("HTTP error")]
    HttpError(#[from] http::Error),
    /// Invalid redirection URL
    #[error("Invalid redirect url")]
    InvalidRedirectUrl(String),
    /// Invalid HTTP header
    #[error("Invalid header")]
    InvalidHeader(#[from] InvalidHeaderValue),
    /// Invalid HTTP Signature
    #[error("Signature error")]
    SignatureError(#[from] p256::ecdsa::Error),
    /// General error
    #[error("General error")]
    GeneralError(String),
    /// JSON De/Serialization error
    #[error("JSON De/Serialization error")]
    JsonError(#[from] serde_json::Error),
    /// HTTP response failed to parse into JSON model
    #[error("HTTP JSON Deserialization")]
    JsonHttpResponseError {
        /// HTTP status code
        status: http::StatusCode,
        /// Target HTTP url
        url: String,
        /// HTTP headers
        headers: http::HeaderMap,
        /// HTTP message body
        body: String,
        /// [`serde_json`] error
        inner: serde_json::Error,
    },
    /// Base64 decoding error
    #[error("Base64 Decode error")]
    DecodeError(#[from] base64ct::Error),
    /// I/O error
    #[error("I/O error")]
    IoError(#[from] std::io::Error),
    /// Failed processing HTTP request
    #[error("Failed processing HTTP request")]
    InvalidRequest(String),
    /// Token expired
    #[error("Token expired")]
    TokenExpired(DateTime<Utc>),
    /// Unknown error
    #[error("unknown xal error")]
    Unknown,
}
