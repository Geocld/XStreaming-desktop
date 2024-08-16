//! Token store

use crate::auth::models::response::{DeviceToken, TitleToken, UserToken, WindowsLiveTokens, XSTSToken};
use crate::auth::error::Error;
use crate::auth::models::{XalAppParameters, XalClientParameters};
use crate::auth::authenticator::XalAuthenticator;

use chrono::{DateTime, Utc};
use log::trace;
use serde::{Deserialize, Serialize};
use std::io::{Read, Seek};

/// Model describing authentication tokens
///
/// Can be used for de-/serializing tokens and respective
/// authentication parameters.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TokenStore {
    /// Stored app parameters
    pub app_params: XalAppParameters,
    /// Stored client parameters
    pub client_params: XalClientParameters,
    /// Xbox Live sandbox id used for authentication
    pub sandbox_id: String,
    /// Windows Live access- & refresh token
    pub live_token: WindowsLiveTokens,
    /// Xbox live user token
    pub user_token: Option<UserToken>,
    /// Xbox live title token
    pub title_token: Option<TitleToken>,
    /// Xbox live device token
    pub device_token: Option<DeviceToken>,
    /// Xbox live authorization/XSTS token
    pub authorization_token: Option<XSTSToken>,
    /// Update timestamp of this struct
    ///
    /// Can be updated by calling `update_timestamp`
    /// on its instance.
    pub updated: Option<DateTime<Utc>>,
}

impl From<TokenStore> for XalAuthenticator {
    fn from(value: TokenStore) -> Self {
        Self::new(
            value.app_params.clone(),
            value.client_params.clone(),
            value.sandbox_id.clone(),
        )
    }
}

impl ToString for TokenStore {
    fn to_string(&self) -> String {
        serde_json::to_string(&self).expect("Failed to serialize TokenStore")
    }
}

impl TokenStore {
    /// Load a tokenstore from a file by providing the filename/path to the
    /// serialized JSON
    ///
    /// Returns the TokenStore instance on success
    ///
    /// # Examples
    ///
    /// Load tokenstore from file
    ///
    /// ```
    /// # use xal::TokenStore;
    /// # fn demo() -> Result<(), xal::Error> {
    /// let tokenstore = TokenStore::load_from_file("tokens.json")?;
    /// # Ok(())
    /// # }
    /// // refresh tokens etc. ..
    /// ```
    pub fn load_from_file(filepath: &str) -> Result<Self, Error> {
        trace!("Trying to load tokens from filepath={:?}", filepath);
        let mut file = std::fs::File::options().read(true).open(filepath)?;

        let mut json = String::new();
        file.read_to_string(&mut json)?;

        Self::deserialize_from_string(&json)
    }

    /// Load tokens from JSON string
    ///
    /// # Examples
    ///
    /// ```
    /// # use xal::TokenStore;
    /// # fn demo() -> Result<(), xal::Error> {
    /// let tokens_json = std::fs::read_to_string("tokens.json")?;
    /// let tokenstore = TokenStore::deserialize_from_string(&tokens_json)?;
    /// # Ok(())
    /// # }
    /// // refresh tokens etc. ..
    /// ```
    pub fn deserialize_from_string(json: &str) -> Result<Self, Error> {
        trace!("Attempting to deserialize token data");
        serde_json::from_str(json).map_err(std::convert::Into::into)
    }

    /// Save tokens to writer
    ///
    /// # Examples
    ///
    /// ```
    /// # use xal::TokenStore;
    /// # fn demo() -> Result<(), xal::Error> {
    /// let tokenstore = TokenStore::load_from_file("tokens.json")?;
    /// // refresh tokens ...
    /// let file = std::fs::File::create("tokens.json")?;
    /// tokenstore.save_to_writer(&file).ok();
    /// # Ok(())
    /// # }
    /// ```
    pub fn save_to_writer(&self, writer: impl std::io::Write) -> Result<(), Error> {
        serde_json::to_writer_pretty(writer, self).map_err(std::convert::Into::into)
    }

    /// Save the tokens to a JSON file
    ///
    /// NOTE: If the file already exists it will be overwritten
    ///
    /// # Examples
    ///
    /// ```
    /// # use xal::TokenStore;
    /// # fn demo() -> Result<(), xal::Error> {
    /// let tokenstore = TokenStore::load_from_file("tokens.json")?;
    /// // refresh tokens ...
    /// tokenstore.save_to_file("tokens.json").ok();
    /// # Ok(())
    /// # }
    /// ```
    pub fn save_to_file(&self, filepath: &str) -> Result<(), Error> {
        trace!(
            "Trying to open tokenfile read/write/create path={:?}",
            filepath
        );
        let mut file = std::fs::File::options()
            .read(true)
            .write(true)
            .create(true)
            .open(filepath)?;

        file.rewind()?;
        file.set_len(0)?;

        trace!("Saving tokens path={:?}", filepath);
        self.save_to_writer(file)
    }

    /// Update the timestamp of this instance
    ///
    /// # Examples
    ///
    /// ```
    /// # use xal::TokenStore;
    /// # fn demo() -> Result<(), xal::Error> {
    /// let mut tokenstore = TokenStore::load_from_file("tokens.json")?;
    /// // refresh tokens ...
    /// tokenstore.update_timestamp();
    /// tokenstore.save_to_file("tokens.json").ok();
    /// # Ok(())
    /// # }
    /// ```
    pub fn update_timestamp(&mut self) {
        self.updated = Some(chrono::offset::Utc::now());
    }
}

#[cfg(test)]
mod tests {
    use oauth2::TokenResponse;
    use rand::distributions::{Alphanumeric, DistString};

    use super::*;

    fn random_filename() -> String {
        Alphanumeric.sample_string(&mut rand::thread_rng(), 16)
    }

    #[test]
    fn read_invalid_tokenfile() {
        let res = TokenStore::load_from_file(&random_filename());

        assert!(res.is_err());
    }

    #[test]
    fn read_from_string() {
        let tokens_str = r#"{"app_params":{"client_id":"00000000441cc96b","title_id":"42","auth_scopes":["service::user.auth.xboxlive.com::MBI_SSL"],"redirect_uri":"https://login.live.com/oauth20_desktop.srf"},"client_params":{"user_agent":"XAL","device_type":"NINTENDO","client_version":"0.0.0","query_display":"touch"},"sandbox_id":"RETAIL","live_token":{"access_token":"accessTokenABC","token_type":"bearer","expires_in":86400,"refresh_token":"refreshTokenABC","scope":"service::user.auth.xboxlive.com::MBI_SSL"}}"#;
        let ts = TokenStore::deserialize_from_string(tokens_str).unwrap();

        assert_eq!(ts.app_params.client_id, "00000000441cc96b");
        assert_eq!(ts.app_params.title_id, Some("42".into()));
        assert_eq!(
            ts.app_params.auth_scopes.first().unwrap().as_str(),
            "service::user.auth.xboxlive.com::MBI_SSL"
        );
        assert_eq!(
            ts.app_params.redirect_uri.unwrap().as_str(),
            "https://login.live.com/oauth20_desktop.srf"
        );

        assert_eq!(ts.client_params.client_version, "0.0.0");
        assert_eq!(ts.client_params.device_type.to_string(), "Nintendo");
        assert_eq!(ts.client_params.query_display, "touch");
        assert_eq!(ts.client_params.user_agent, "XAL");

        assert_eq!(ts.live_token.access_token().secret(), "accessTokenABC");
        assert_eq!(
            ts.live_token.refresh_token().unwrap().secret(),
            "refreshTokenABC"
        );
        assert_eq!(
            ts.live_token.expires_in().unwrap(),
            std::time::Duration::from_secs(86400)
        );
        assert_eq!(
            ts.live_token.scopes().unwrap().first().unwrap().as_str(),
            "service::user.auth.xboxlive.com::MBI_SSL"
        );
    }
}
