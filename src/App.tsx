import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import { once } from "@tauri-apps/api/event";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name }));
  }

  async function handleRedirect() {
    const result = await invoke('get_redirect_uri');
    console.log('result: ', result);
  }

  async function startOAuth() {
    await invoke('open_auth_window');
  }

  once("auth-code", (event) => {
    const redirectUri = event.payload as string
    console.log('redirectUri:', redirectUri);
    const url = new URL(redirectUri);
    const error = url.searchParams.get('error');
    if (error) {
      // const error_description = url.searchParams.get('error_description');
      console.log('error:', error);
      return false;
    }

    const code = url.searchParams.get('code');
    if (code) {
      const state = url.searchParams.get('state');

      console.log('code:', code)
      console.log('state:', state)
    }
  })

  return (
    <div className="container">
      <h1>Welcome to Tauri!</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>

      <button onClick={handleRedirect}>Login</button>
      <button onClick={startOAuth}>Open new window</button>

      <p>{greetMsg}</p>
    </div>
  );
}

export default App;
