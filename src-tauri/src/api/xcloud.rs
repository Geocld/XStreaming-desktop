use directories::ProjectDirs;
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use reqwest::{header, header::HeaderMap, Client, ClientBuilder, StatusCode, Url};
use thiserror::Error;
use crate::auth::tokenstore::TokenStore;
use crate::auth::authenticator::XalAuthenticator;
use crate::api::gssv;

#[tauri::command]
pub async fn get_streaming_token() -> serde_json::Value {
    if let Some(proj_dirs) = ProjectDirs::from("com", "Geocld", "xstreaming") {
        let config_dir = proj_dirs.config_dir();
        let token_path = config_dir.join("tokens.json");
        let ts = TokenStore::load_from_file(token_path.to_str().unwrap()).unwrap();
        let mut authenticator = XalAuthenticator::from(ts.clone());
        let xsts_mc_services = authenticator
                                .get_xsts_token(
                                    ts.device_token.as_ref(),
                                    ts.title_token.as_ref(),
                                    ts.user_token.as_ref(),
                                    "http://gssv.xboxlive.com",
                                )
                                .await.unwrap();
        
        let is_valid = xsts_mc_services.check_validity();
        if let Err(e) = is_valid {
            println!("token验证失败: {}", e);
            serde_json::json!({
                "code": "400",
                "message": "streaming token验证失败"
            })
        } else {
            println!("token有效");
            // println!("xsts_mc_services: {:?}", xsts_mc_services);
            let identity_token = xsts_mc_services.authorization_header_value();
            println!("identityToken: {identity_token}");

            let json_value = serde_json::to_value(&xsts_mc_services).unwrap();
            println!("json_value: {}", json_value);

            json_value
        }
    } else {
        serde_json::json!({
            "code": "400",
            "message": "token.json is empty"
        })
    }
}

#[derive(Error, Debug)]
pub enum GssvApiError {
    #[error(transparent)]
    HttpError(#[from] reqwest::Error),
    #[error(transparent)]
    Serialization(#[from] serde_json::error::Error),
    #[error("Unknown error")]
    Unknown,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct LoginRequest {
    token: String,
    offering_id: String,
}

#[tauri::command]
pub async fn get_stream_token(offering_id: String, token: String) -> serde_json::Value {
  let url = format!(
    "https://{}.gssv-play-prod.xboxlive.com/v2/login/user",
    offering_id
  );
  let mut headers = HeaderMap::new();
  headers.insert(
    "x-gssv-client", "XboxComBrowser".parse().unwrap()
  );

  let client = reqwest::Client::new();
  let res = client
      .post(url)
      .headers(headers)
      .json(&LoginRequest {
          token: token.into(),
          offering_id: offering_id.into(),
      })
      .send()
      .await
      .map_err(GssvApiError::HttpError)
      .unwrap()
      .error_for_status()
      .unwrap()
      .text()
      .await
      .unwrap();

  println!("get_user_profile res: {:?}", res);
  let json = serde_json::from_str(&res).unwrap();
  json
}

#[tauri::command]
pub async fn start_session() {
  // TODO
  // let gssv_api = gssv::GssvApi::new(base_url, gssv_token, platform);
  // gssv_api.start_session(server_id, title_id)

}