import { invoke } from "@tauri-apps/api/tauri";

export default class XcloudApi {
  sessionId: string
  baseUrl: string
  gssvToken: string
  platform: string

  constructor(baseUrl: string, gssvToken: string, platform: string) {
    this.sessionId = '';
    this.baseUrl = baseUrl;
    this.gssvToken = gssvToken;
    this.platform = platform; // home | cloud
  }

  async startSession(consoleId: string) {
    const result: any = await invoke('start_session', { 
      baseUrl: this.baseUrl, 
      gssvToken: this.gssvToken, 
      platform: this.platform, 
      serverId: consoleId, 
      titleId: ''
    });
    console.log('startSession result:', result);
    const sessionId = result.sessionPath.split('/')[3];
    this.sessionId = sessionId;

    return result;
  }

  waitState() {
    return new Promise((resolve, reject) => {
      this.getSessionState().then(res => {
        console.log('res:', res);
        switch (res.state) {
          // Streaming ready
          case 'Provisioned':
            resolve(res);
            break;
          // Connecting
          case 'WaitingForResources':
          case 'Provisioning':
            setTimeout(() => {
              // Continue
              this.waitState()
                .then(state => {
                  resolve(state);
                })
                .catch(error => {
                  reject(error);
                });
            }, 1000);
            break;
          case 'ReadyToConnect':
            // TODO: Do MSAL Auth
            break;
          case 'Failed':
            reject('Streaming failed: ' + res.errorDetails.message);
            break;
          default:
            console.log('unknown state:', res);
            reject('Streaming failed');
            break;
        }
      })
      .catch(e => {
        console.log('[waitState] error:', e);
        reject(e);
      });
    });
  }

  getSessionConfig() {
    return new Promise(resolve => {
      const result: any = invoke('get_session_config', { 
        baseUrl: this.baseUrl, 
        gssvToken: this.gssvToken, 
        platform: this.platform,
        sessionId: this.sessionId
      });
      resolve(result);
    })
  }

  async getSessionState() {
    console.log('this.baseUrl:', this.baseUrl)
    console.log('this.baseUrl:', this.gssvToken)
    console.log('this.baseUrl:', this.platform)
    console.log('this.baseUrl:', this.sessionId)
    const result: any = await invoke('get_session_state', { 
      baseUrl: this.baseUrl, 
      gssvToken: this.gssvToken, 
      platform: this.platform,
      sessionId: this.sessionId
    });
    console.log('getSessionState result:', result);
    return result;
  }

  async sendSdp(sdp: string) {
    const result: any = await invoke('send_sdp', { 
      baseUrl: this.baseUrl, 
      gssvToken: this.gssvToken, 
      platform: this.platform,
      sessionId: this.sessionId,
      sdp
    });
    console.log('sendSdp result:', result);
    return result;
  }

  async getSdp() {
    const result: any = await invoke('get_sdp', { 
      baseUrl: this.baseUrl, 
      gssvToken: this.gssvToken, 
      platform: this.platform,
      sessionId: this.sessionId
    });
    console.log('getSdp result:', result);
    return result;
  }

  async sendIce(ice: any) {
    const result: any = await invoke('send_ice', { 
      baseUrl: this.baseUrl, 
      gssvToken: this.gssvToken, 
      platform: this.platform,
      sessionId: this.sessionId,
      ice
    });
    console.log('sendIce result:', result);
    return result;
  }

  async getIce() {
    const result: any = await invoke('get_ice', { 
      baseUrl: this.baseUrl, 
      gssvToken: this.gssvToken, 
      platform: this.platform,
      sessionId: this.sessionId
    });
    console.log('getIce result:', result);
    return result;
  }
}