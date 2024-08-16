// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod auth;

use auth::authenticator::XalAuthenticator;
use auth::models::{XalAppParameters, XalClientParameters};
use auth::error::Error;

use log::{debug, info, trace};
use tauri::{WindowBuilder, WindowUrl, AppHandle};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn open_auth_window(app: AppHandle) {
    // TODO
    let window = WindowBuilder::new(
        &app,
        "oauth",
        WindowUrl::External("https://baidu.com".parse().unwrap())
    )
    .title("OAuth Login")
    .inner_size(500.0, 600.0)
    .always_on_top(true)
    .build()
    .unwrap();
}

#[tauri::command]
async fn get_redirect_uri() -> String {
    let mut authenticator = XalAuthenticator::new(XalAppParameters::default(), XalClientParameters::default(), "RETAIL".to_owned());
    let device_token = authenticator.get_device_token().await.unwrap();
    let state = XalAuthenticator::generate_random_state();
    let (code_challenge, code_verifier) = XalAuthenticator::generate_code_verifier();

    let (auth_resp, session_id) = authenticator
            .sisu_authenticate(&device_token, &code_challenge, &state)
            .await.unwrap();
    println!(
        "SISU Authenticate response={:?} Session Id={:?}",
        auth_resp, session_id
    );
    let msa_oauth_redirect = auth_resp.msa_oauth_redirect.to_string();

    msa_oauth_redirect
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, get_redirect_uri, open_auth_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
