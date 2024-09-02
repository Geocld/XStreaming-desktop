// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod auth;

use auth::authenticator::XalAuthenticator;
use auth::models::{XalAppParameters, XalClientParameters};
use auth::tokenstore::TokenStore;
use once_cell::sync::OnceCell;

use tauri::{AppHandle, Manager, WindowBuilder, WindowUrl};
use oauth2::PkceCodeVerifier;
use directories::ProjectDirs;
use reqwest::{header, header::HeaderMap, Client, ClientBuilder, StatusCode, Url};
use serde::{de::DeserializeOwned, Deserialize, Serialize};

pub static INSTANCE: OnceCell<AppHandle> = OnceCell::new();

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn open_auth_window(app: AppHandle) {
    let window = WindowBuilder::new(
        &app,
        "oauth",
        WindowUrl::External("https://tauri.app/".parse().unwrap())
    )
    .title("OAuth Login")
    .inner_size(500.0, 600.0)
    .always_on_top(true)
    .build()
    .unwrap();
}

#[tauri::command]
async fn get_redirect_uri(handle: tauri::AppHandle) {
    let mut authenticator = XalAuthenticator::new(XalAppParameters::default(), XalClientParameters::default(), "RETAIL".to_owned());

    let device_token = authenticator.get_device_token().await.unwrap();
    let state = XalAuthenticator::generate_random_state();
    let (code_challenge, code_verifier) = XalAuthenticator::generate_code_verifier();

    let code_verifier_str = PkceCodeVerifier::secret(&code_verifier).to_string();

    println!("code_verifier_str: {:?}", code_verifier_str);

    // let test = code_verifier.secret();
    
    let (auth_resp, session_id) = authenticator
        .sisu_authenticate(&device_token, &code_challenge, &state)
        .await.unwrap();
    println!(
        "SISU Authenticate response={:?} Session Id={:?}",
        auth_resp, session_id
    );
    let msa_oauth_redirect = auth_resp.msa_oauth_redirect.to_string();

    tauri::WindowBuilder::new(
        &handle,
        "oauth", /* the unique window label */
        tauri::WindowUrl::External(msa_oauth_redirect.parse().unwrap())
    )
    .on_navigation(move |url| {
        let prefix = "ms-xal-000000004c20a908";
        let redirect_url = url.to_string();
        println!("redirect_url: {:?}", redirect_url);

        // CLose window
        if redirect_url.starts_with(prefix) {
            let auth_code = redirect_url.replace(prefix, "");
            // handle.emit_all("auth-code", auth_code).unwrap();
            // if let Some(window) = handle.get_window("oauth") {
            //     window.close().unwrap();
            // }
            if let Some(app_handle) = crate::INSTANCE.get() {
                app_handle.emit_all("auth-code", url.clone()).unwrap();
                if let Some(window) = app_handle.get_window("oauth") {
                    
                    // Close auth window
                    window.close().unwrap();

                    // Auth sisu token
                    println!("From callback: Redirect URL={:?}", url.clone());
                    println!("Parsing redirect URI");
                    
                    let authorization_code =
                        XalAuthenticator::parse_authorization_code_response(&url, Some(&state)).unwrap();
                    
                    println!("Authorization Code: {:?}", &authorization_code);
                    println!("Getting Windows Live tokens (exchange code)");

                    let mut authenticator = authenticator.clone();
                    let authorization_code = authorization_code.clone();
                    let device_token = device_token.clone();
                    let session_id = session_id.clone();
                    let code_verifier_str = code_verifier_str.clone();

                    tauri::async_runtime::spawn(async move {
                        // 拿到登录后的redirect_url，进行完整的sisu登录流处理
                        let code_verifier = PkceCodeVerifier::new(code_verifier_str);
                        let live_tokens = authenticator
                            .exchange_code_for_token(authorization_code, Some(code_verifier)).await.unwrap();

                        println!("Windows live tokens={:?}", &live_tokens);

                        println!("Getting Sisu authorization response");
                        let sisu_resp = authenticator
                            .sisu_authorize(&live_tokens, &device_token, Some(session_id))
                            .await.unwrap();
                        println!("Sisu authorizatione response={:?}", sisu_resp);

                        let mut ts = TokenStore {
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

                        if let Some(proj_dirs) = ProjectDirs::from("com", "Geocld", "xstreaming") {
                            let config_dir = proj_dirs.config_dir();
                            let token_path = config_dir.join("tokens.json");
                            std::fs::create_dir_all(config_dir).unwrap();

                            // if !token_path.exists() {
                            //     let token_path = token_path.to_str().unwrap();
                            //     println!("save_to_file: {:?}", token_path);
                            //     ts.update_timestamp();
                            //     ts.save_to_file(token_path).unwrap();

                            //     println!("Login successfully!");
                            // }
                            let token_path = token_path.to_str().unwrap();
                            println!("save_to_file: {:?}", token_path);
                            ts.update_timestamp();
                            ts.save_to_file(token_path).unwrap();

                            println!("Login successfully!");
                        }
                    });
                }
            }
        }
        true
    })
    .build()
    .unwrap();
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
async fn get_web_token() -> serde_json::Value {
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
                "message": "token验证失败"
            })
        } else {
            println!("token有效");
            // println!("xsts_mc_services: {:?}", xsts_mc_services);
            let identity_token = xsts_mc_services.authorization_header_value();
            println!("identityToken: {identity_token}");

            let json_value = serde_json::to_value(&xsts_mc_services).unwrap();
            println!("json_value: {}", json_value);

            // Get consoles
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

            json_value
        }
    } else {
        serde_json::json!({
            "code": "400",
            "message": "token.json is empty"
        })
    }
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            INSTANCE.set(app.handle()).unwrap();

            let test = ProjectDirs::from("com", "Geocld", "xstreaming");

            println!("test: {:?}", test);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet, 
            get_redirect_uri, 
            open_auth_window,
            get_web_token
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
