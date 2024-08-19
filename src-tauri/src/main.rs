// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod auth;

use auth::authenticator::XalAuthenticator;
use auth::models::{XalAppParameters, XalClientParameters};
use auth::error::Error;
use once_cell::sync::OnceCell;

use log::{debug, info, trace};
use tauri::{AppHandle, Manager, WindowBuilder, WindowUrl};

pub static INSTANCE: OnceCell<AppHandle> = OnceCell::new();

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
        WindowUrl::External("https://tauri.app/".parse().unwrap())
    )
    .title("OAuth Login")
    .inner_size(500.0, 600.0)
    .always_on_top(true)
    .build()
    .unwrap();
}

#[tauri::command]
async fn get_redirect_uri(handle: tauri::AppHandle) -> String {
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

    tauri::WindowBuilder::new(
        &handle,
        "oauth", /* the unique window label */
        tauri::WindowUrl::External(msa_oauth_redirect.parse().unwrap())
      )
    .on_navigation(|url| {
        // let prefix = "ms-xal-000000004c20a908:";
        let prefix = "ms-xal-000000004c20a908";
        let url = url.to_string();
        println!("url: {:?}", url);
        if url.starts_with(prefix) {
            let auth_code = url.replace(prefix, "");
            // handle.emit_all("auth-code", auth_code).unwrap();
            // if let Some(window) = handle.get_window("oauth") {
            //     window.close().unwrap();
            // }
            if let Some(app_handle) = crate::INSTANCE.get() {
                app_handle.emit_all("auth-code", url).unwrap();
                if let Some(window) = app_handle.get_window("oauth") {
                    // TODO: Auth sisu token
                    window.close().unwrap();
                }
            }
        }
        true
    })
    .build().unwrap();

    msa_oauth_redirect
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            INSTANCE.set(app.handle()).unwrap();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, get_redirect_uri, open_auth_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
