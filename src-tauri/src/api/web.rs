use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use reqwest::header::HeaderMap;
use crate::auth::tokenstore::TokenStore;
use crate::auth::authenticator::XalAuthenticator;

#[tauri::command]
pub async fn get_web_token() -> serde_json::Value {
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
                                    "http://xboxlive.com",
                                )
                                .await.unwrap();
        
        let is_valid = xsts_mc_services.check_validity();
        if let Err(e) = is_valid {
            println!("token验证失败: {}", e);
            serde_json::json!({
                "code": "400",
                "message": "web token验证失败"
            })
        } else {
            println!("token有效");
            // println!("xsts_mc_services: {:?}", xsts_mc_services);
            // let identity_token = xsts_mc_services.authorization_header_value();
            // println!("identityToken: {identity_token}");

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

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConsolesResponse {
    pub status: Status,
    pub result: Vec<Console>,
    pub agent_user_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Status {
    pub error_code: String,
    pub error_message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Console {
    pub id: String,
    pub name: String,
    pub locale: String,
    pub power_state: String,
    pub console_type: String,
}

#[tauri::command]
pub async fn get_consoles(identity_token: String) -> serde_json::Value {
    println!("get_consoles: {:?}", identity_token);
    let client = reqwest::Client::new();

    let mut headers = HeaderMap::new();
    headers.insert(
        "Authorization", identity_token.parse().unwrap()
    );
    headers.insert(
        "Accept-Language", "en-US".parse().unwrap()
    );
    headers.insert(
        "x-xbl-contract-version", "2".parse().unwrap()
    );
    headers.insert(
        "x-xbl-client-name", "XboxApp".parse().unwrap()
    );
    headers.insert(
        "x-xbl-client-type", "UWA".parse().unwrap()
    );
    headers.insert(
        "x-xbl-client-version", "39.39.22001.0".parse().unwrap()
    );

    let consoles = client
        .get("https://xccs.xboxlive.com/lists/devices?queryCurrentDevice=false&includeStorageDevices=true")
        .headers(headers)
        .send()
        .await
        .unwrap()
        .json::<ConsolesResponse>()
        .await
        .unwrap_or_else(|_| ConsolesResponse {
            status: Status {
                error_code: "ERROR".to_string(),
                error_message: Some("Request failed".to_string()),
            },
            result: Vec::new(),
            agent_user_id: None,
        });

    println!("consoles: {:?}", consoles);
    let console_json = serde_json::to_value(&consoles).unwrap();
    println!("console_json: {}", console_json);
    console_json
}

#[tauri::command]
pub async fn get_user_profile(identity_token: String) -> serde_json::Value {
  let client = reqwest::Client::new();

  let mut headers = HeaderMap::new();
  headers.insert(
      "Authorization", identity_token.parse().unwrap()
  );
  headers.insert(
      "Accept-Language", "en-US".parse().unwrap()
  );
  headers.insert(
      "x-xbl-contract-version", "3".parse().unwrap()
  );
  headers.insert(
      "x-xbl-client-name", "XboxApp".parse().unwrap()
  );
  headers.insert(
      "x-xbl-client-type", "UWA".parse().unwrap()
  );
  headers.insert(
      "x-xbl-client-version", "39.39.22001.0".parse().unwrap()
  );

  let res = client
      .get("https://profile.xboxlive.com/users/me/profile/settings?settings=GameDisplayName,GameDisplayPicRaw,Gamerscore,Gamertag")
      .headers(headers)
      .send()
      .await
      .unwrap()
      .text()
      .await
      .unwrap();

  println!("get_user_profile res: {:?}", res);
  let profile_json = serde_json::from_str(&res).unwrap();
  profile_json
}