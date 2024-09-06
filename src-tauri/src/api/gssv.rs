use serde::{de::DeserializeOwned, Deserialize, Serialize};
use serde_aux::prelude::*;
use reqwest::{header, header::HeaderMap, Client, ClientBuilder, StatusCode, Url};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum GssvApiError {
    #[error(transparent)]
    HttpError(#[from] reqwest::Error),
    #[error(transparent)]
    Serialization(#[from] serde_json::error::Error),
    #[error("Unknown error")]
    Unknown,
}

pub struct GssvApi {
  client: Client,
  base_url: Url,
  platform: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SessionResponse {
    session_path: String,
}

pub enum SessionState {
    WaitingForResources,
    ReadyToConnect,
    Provisioning,
    Provisioned,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct AppEnvironment {
    client_app_id: String,
    client_app_type: String,
    client_app_version: String,
    client_sdk_version: String,
    http_environment: String,
    sdk_install_id: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct AppInfo {
    env: AppEnvironment,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct DevHardwareInfo {
    make: String,
    model: String,
    sdk_type: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct DeviceInfo {
    app_info: AppInfo,
    dev: DevInfo,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct DevDisplayInfo {
    dimensions: DevDisplayDimensions,
    pixel_density: DevDisplayPixelDensity,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct DevDisplayPixelDensity {
    dpi_x: u16,
    dpi_y: u16,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct DevDisplayDimensions {
    width_in_pixels: u16,
    height_in_pixels: u16,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct DevOsInfo {
    name: String,
    ver: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct DevInfo {
    hw: DevHardwareInfo,
    os: DevOsInfo,
    display_info: DevDisplayInfo,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct GssvSessionSettings {
    nano_version: String,
    enable_text_to_speech: bool,
    high_contrast: u8,
    locale: String,
    use_ice_connection: bool,
    timezone_offset_minutes: u32,
    sdk_type: String,
    os_name: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ServerDetails {
    ip_address: String,
    port: u32,
    ip_v4_address: String,
    ip_v4_port: u32,
    ice_exchange_path: String,
    stun_server_address: Option<String>
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SessionConfig {
    keep_alive_pulse_in_seconds: u32,
    server_details: ServerDetails,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GssvSessionConfig {
    title_id: String,
    system_update_group: String,
    settings: GssvSessionSettings,
    server_id: String,
    fallback_region_names: Vec<String>,
}

/* Responses */
#[derive(Serialize, Deserialize, Debug)]
pub struct ErrorDetails {
    code: Option<String>,
    message: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SessionStateResponse {
    pub state: String,
    pub error_details: Option<ErrorDetails>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct ChannelVersion {
    min_version: u8,
    max_version: u8,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ChatAudioFormat {
    codec: String,
    container: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct ChatConfiguration {
    bytes_per_sample: u8,
    expected_clip_duration_ms: u32,
    format: ChatAudioFormat,
    num_channels: u8,
    sample_frequency_hz: u32,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct SdpConfiguration {
    chat_configuration: ChatConfiguration,
    chat: ChannelVersion,
    control: ChannelVersion,
    input: ChannelVersion,
    message: ChannelVersion,
    #[serde(skip_serializing_if = "Option::is_none")]
    audio: Option<ChannelVersion>,
    #[serde(skip_serializing_if = "Option::is_none")]
    video: Option<ChannelVersion>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct GssvSdpOffer {
    message_type: String,
    sdp: String,
    configuration: SdpConfiguration,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SdpExchangeResponse {
    #[serde(with = "crate::utils::json_string")]
    pub exchange_response: SdpResponse,
    pub error_details: Option<ErrorDetails>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ChatConfigurationResponse {
    format: ChatAudioFormat,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SdpResponse {
    pub chat: u16,
    pub chat_configuration: ChatConfigurationResponse,
    pub control: u16,
    pub input: u16,
    pub message: u16,
    /// Usually 'answer'
    pub message_type: Option<String>,
    /// SDP data
    pub sdp: Option<String>,
    /// Usually 'answer'
    pub sdp_type: Option<String>,
    // Usually 'success'
    pub status: Option<String>,
    /// Only returned on error
    pub debug_info: Option<String>,
}

#[derive(Default, Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IceCandidate {
    pub candidate: String,
    pub sdp_mid: Option<String>,
    #[serde(rename = "sdpMLineIndex")]
    #[serde(deserialize_with = "deserialize_option_number_from_string")]
    pub sdp_mline_index: Option<u16>,
    pub username_fragment: Option<String>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct IceExchangeResponse {
    #[serde(with = "crate::utils::json_string")]
    pub exchange_response: Vec<IceCandidate>,
    pub error_details: Option<ErrorDetails>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct IceMessage {
    message_type: String,
    candidate: Vec<IceCandidate>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct KeepaliveResponse {
    pub alive_seconds: Option<u32>,
    pub reason: String,
}

impl GssvApi {
    pub fn new(base_url: Url, gssv_token: &str, platform: String) -> Self {
        let mut headers = header::HeaderMap::new();

        let mut auth_value = header::HeaderValue::from_str(&format!("Bearer {}", gssv_token))
            .expect("Failed assembling auth header");
        auth_value.set_sensitive(true);
        headers.insert(header::AUTHORIZATION, auth_value);

        Self {
            client: ClientBuilder::new()
                .default_headers(headers)
                .build()
                .expect("Failed to build client"),
            base_url,
            platform,
        }
    }

    pub async fn start_session(
        &self,
        server_id: Option<&str>,
        title_id: Option<&str>,
    ) -> Result<SessionResponse, GssvApiError> {
        let device_info = DeviceInfo {
            app_info: AppInfo {
                env: AppEnvironment {
                    client_app_id: "Microsoft.GamingApp".into(),
                    client_app_type: "native".into(),
                    client_app_version: "2203.1001.4.0".into(),
                    client_sdk_version: "5.3.0".into(),
                    http_environment: "prod".into(),
                    sdk_install_id: "".into(),
                },
            },
            dev: DevInfo {
                hw: DevHardwareInfo {
                    make: "Micro-Star International Co., Ltd.".into(),
                    model: "GS66 Stealth 10SGS".into(),
                    sdk_type: "native".into(),
                },
                os: DevOsInfo {
                    name: "Windows 10 Pro".into(),
                    ver: "19041.1.amd64fre.vb_release.191206-1406".into(),
                },
                display_info: DevDisplayInfo {
                    dimensions: DevDisplayDimensions {
                        width_in_pixels: 1920,
                        height_in_pixels: 1080,
                    },
                    pixel_density: DevDisplayPixelDensity { dpi_x: 1, dpi_y: 1 },
                },
            },
        };

        let devinfo_str =
            serde_json::to_string(&device_info).map_err(GssvApiError::Serialization)?;

        let mut headers = HeaderMap::new();
        headers.insert(
            "X-MS-Device-Info",
            devinfo_str.parse().map_err(|_| GssvApiError::Unknown)?,
        );
        headers.insert(
            "User-Agent",
            devinfo_str.parse().map_err(|_| GssvApiError::Unknown)?,
        );

        let request_body = GssvSessionConfig {
            title_id: title_id.unwrap_or("").into(),
            system_update_group: "".into(),
            server_id: server_id.unwrap_or("").into(),
            fallback_region_names: vec![],
            settings: GssvSessionSettings {
                nano_version: "V3;WebrtcTransport.dll".into(),
                enable_text_to_speech: false,
                high_contrast: 0,
                locale: "en-US".into(),
                use_ice_connection: false,
                timezone_offset_minutes: 120,
                sdk_type: "web".into(),
                os_name: "windows".into(),
            },
        };

        self.post_json(
            self.url(&format!("/v5/sessions/{}/play", self.platform)),
            &request_body,
            Some(headers),
        )
        .await
    }

    pub async fn get_session_config(&self, session_id: &str) -> Result<SessionConfig, GssvApiError> {
        self.get_json(self.url(&format!("/v5/sessions/{}/{}/configuration", self.platform, session_id)), None).await
    }

    pub async fn get_session_state(&self, session_id: &str) -> Result<SessionStateResponse, GssvApiError> {
        self.get_json(self.url(&format!("/v5/sessions/{}/{}/state", self.platform, session_id)), None).await
    }

    pub async fn send_sdp(&self, session_id: &str, sdp: &str) -> Result<(), GssvApiError> {
        let resp = self
            .client
            .post(self.url(&format!("/v5/sessions/{}/{}/sdp", self.platform, session_id)))
            .json(&GssvSdpOffer {
                message_type: "offer".into(),
                sdp: sdp.to_string(),
                configuration: SdpConfiguration {
                    chat: ChannelVersion {
                        min_version: 1,
                        max_version: 1,
                    },
                    control: ChannelVersion {
                        min_version: 1,
                        max_version: 3,
                    },
                    input: ChannelVersion {
                        min_version: 1,
                        max_version: 7,
                    },
                    message: ChannelVersion {
                        min_version: 1,
                        max_version: 1,
                    },
                    audio: None,
                    video: None,
                    chat_configuration: ChatConfiguration {
                        bytes_per_sample: 2,
                        expected_clip_duration_ms: 100,
                        format: ChatAudioFormat {
                            codec: "opus".into(),
                            container: "webm".into(),
                        },
                        num_channels: 1,
                        sample_frequency_hz: 24000,
                    },
                },
            })
            .send()
            .await
            .map_err(GssvApiError::HttpError)?;

        match resp.status() {
            StatusCode::ACCEPTED => Ok(()),
            _ => Err(GssvApiError::Unknown),
        }
    }

    pub async fn get_sdp(&self, session_id: &str) -> Result<SdpExchangeResponse, GssvApiError> {
        self.get_json(self.url(&format!("/v5/sessions/{}/{}/sdp", self.platform, session_id)), None).await
    }

    pub async fn send_ice(&self, session_id: &str, ice: Vec<IceCandidate>) -> Result<(), GssvApiError> {
        let resp = self
            .client
            .post(self.url(&format!("/v5/sessions/{}/{}/ice", self.platform, session_id)))
            .json(&IceMessage {
                message_type: "iceCandidate".into(),
                candidate: ice,
            })
            .send()
            .await
            .map_err(GssvApiError::HttpError)?;

        match resp.status() {
            StatusCode::ACCEPTED => Ok(()),
            _ => Err(GssvApiError::Unknown),
        }
    }

    pub async fn get_ice(&self, session_id: &str) -> Result<IceExchangeResponse, GssvApiError> {
        self.get_json(self.url(&format!("/v5/sessions/{}/{}/ice", self.platform, session_id)), None).await
    }

  fn url(&self, path: &str) -> Url {
    self.base_url.join(path).unwrap()
  }

    async fn get_json<T>(&self, url: Url, headers: Option<HeaderMap>) -> Result<T, GssvApiError>
        where
            T: DeserializeOwned,
        {
            let mut req = self.client.get(url);

            if let Some(headers) = headers {
                req = req.headers(headers);
            }

            req.send()
                .await
                .map_err(GssvApiError::HttpError)?
                .error_for_status()?
                .json::<T>()
                .await
                .map_err(GssvApiError::HttpError)
        }

    async fn post_json<RQ, RS>(
        &self,
        url: Url,
        request_body: RQ,
        headers: Option<HeaderMap>,
    ) -> Result<RS, GssvApiError>
    where
        RQ: Serialize,
        RS: DeserializeOwned,
    {
        let mut req = self.client.post(url);

        if let Some(headers) = headers {
            req = req.headers(headers);
        }

        req.json(&request_body)
            .send()
            .await
            .map_err(GssvApiError::HttpError)?
            .error_for_status()?
            .json::<RS>()
            .await
            .map_err(GssvApiError::HttpError)
    }
}