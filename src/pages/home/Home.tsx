import { useState } from 'react'
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
  Card,
  CardBody,
  CardFooter,
  Divider,
} from "@nextui-org/react";
import { invoke } from "@tauri-apps/api/tauri";

import "./Home.css";

function Home() {
  // const { t } = useTranslation()
  const [consoles, setConsoles] = useState([]);

  async function handleLogin() {
    await invoke('login');
  }

  async function getWebToken() {
    const result: any = await invoke('get_web_token');
    console.log('getWebToken result:', result);
    if (result.Token) {
      sessionStorage.setItem('webToken', JSON.stringify(result));
    } else {
      window.alert('getWebToken error:' + result.message);
    }
  }

  async function getConsoles() {
    let webToken: any = sessionStorage.getItem('webToken');
    webToken = JSON.parse(webToken);
    const identityToken = 'XBL3.0 x=' + webToken.DisplayClaims.xui[0].uhs + ';' + webToken.Token;
    const result: any = await invoke('get_consoles', { identityToken });
    console.log('getConsoles result:', result);
    if (result.status.errorCode !== "OK") {
      window.alert('getConsoles error:' + result.errorMessage);
    } else {
      setConsoles(result.result);
    }
  }

  async function getStreamingToken() {
    const result: any = await invoke('get_streaming_token');
    console.log('getStreamingToken result:', result);
    if (result.Token) {
      sessionStorage.setItem('streamingToken', JSON.stringify(result));
    } else {
      window.alert('getStreamingToken error:' + result.message);
    }
  }

  async function getStreamToken() {
    // Call after get streaming token
    let streamingToken: any = sessionStorage.getItem('streamingToken');
    streamingToken = JSON.parse(streamingToken);
    const result: any = await invoke('get_stream_token', { offeringId: 'xhome', token: streamingToken.Token });
    console.log('getStreamToken result:', result);
    if (result.gsToken) {
      sessionStorage.setItem('xHomeToken', JSON.stringify(result));
    }
  }

  async function startSession(consoleId: string) {
    // Call after get stream token
    let xHomeToken: any = sessionStorage.getItem('xHomeToken');
    xHomeToken = JSON.parse(xHomeToken);

    const defaultRegion = xHomeToken.offeringSettings.regions.filter(
      region => region.isDefault,
    )[0];

    const baseUrl = defaultRegion.baseUri;
    const result: any = await invoke('start_session', { baseUrl, gssvToken: xHomeToken.gsToken, platform: 'home', serverId: consoleId, titleId: '' });
    console.log('startSession result:', result);
    const sessionId = result.sessionPath.split('/')[3];
    console.log('sessionId:', sessionId)
  }

  return (
    <>
      <Navbar>
        <NavbarBrand>
          <p className="font-bold text-inherit">XStreaming</p>
        </NavbarBrand>
        <NavbarContent className="hidden sm:flex gap-4" justify="start">
          <NavbarItem isActive>
            <Link href="#">Consoles</Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="#">
              Xcloud
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="#">
              Settings
            </Link>
          </NavbarItem>
        </NavbarContent>
        <NavbarContent justify="end">
          <NavbarItem>
            <Button color="primary" variant="flat" onClick={handleLogin}>
              login
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <div>
        <Button color="primary" onClick={getWebToken}>
          getWebToken
        </Button>

        <Button color="primary" onClick={getStreamingToken}>
        getStreamingToken
        </Button>

        <Button color="primary" onClick={getStreamToken}>
          getStreamToken
        </Button>

        <Button color="primary" onClick={getConsoles}>
          getConsoles
        </Button>
      </div>

      <div>
        {
          consoles.map(console => {
            return (
              <Card className="max-w-[200px]" key={console.id}>
                <CardBody>
                  <p>{ console.name }</p>
                  <p>{ console.powerState }</p>
                </CardBody>
                <Divider />
                <CardFooter>
                  <Button color="primary" fullWidth onClick={() => startSession(console.id)}>
                    Start
                  </Button>
                </CardFooter>
              </Card>
            )
          })
        }
        
      </div>
    </>
  );
}

export default Home;
