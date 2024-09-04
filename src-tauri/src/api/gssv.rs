use serde::{de::DeserializeOwned, Deserialize, Serialize};
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
pub struct GssvSessionConfig {
    title_id: String,
    system_update_group: String,
    settings: GssvSessionSettings,
    server_id: String,
    fallback_region_names: Vec<String>,
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

  fn url(&self, path: &str) -> Url {
    self.base_url.join(path).unwrap()
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