import Application from '../application'
import axios from 'axios'

class Http {
  get(host: string, path: string, headers: any) {
    return new Promise((resolve, reject) => {
      const hostHeaders = {
        // 'Content-Type': 'application/json',
        ...headers,
      };

      axios
        .get(`https://${host}${path}`, {
          headers: hostHeaders,
        })
        .then((res: any) => {
          if (res.status === 200 || res.status === 204) {
            resolve(res.data);
          } else {
            resolve({
              statuscode: res.code,
              headers: res.headers,
              body: res.data,
              message: 'Error fetching ' + host + path,
            });
          }
        })
        .catch(e => {
          reject(e);
        });
    });
  }

  post(host: string, path: string, headers: any, data: any) {
    return new Promise((resolve, reject) => {
      const hostHeaders = {
        // 'Content-Type': 'application/json',
        ...headers,
      };

      if (typeof data === 'object') {
        data = JSON.stringify(data);
      }

      axios
        .post(`https://${host}${path}`, data, {
          headers: hostHeaders,
        })
        .then((res: any) => {
          if (res.status === 200 || res.status === 202) {
            resolve(res.data);
          } else {
            resolve({
              statuscode: res.code,
              headers: res.headers,
              body: res.data,
              message: 'Error fetching ' + host + path,
            });
          }
        })
        .catch(e => {
          reject(e);
        });
    });
  }
}

export default class AchivementManager {
  _application: Application

  constructor(application){
    this._application = application
  }

  getHistoryAchivements() {
    const http = new Http();
    const settings: any = this._application._store.get('settings', {})
    const preferred_game_language = settings.preferred_game_language || 'en-US'

    return new Promise((resolve, reject) => {
      const uhs = this._application.webToken.data.DisplayClaims.xui[0].uhs;
      const xid = this._application.webToken.data.DisplayClaims.xui[0].xid;

      http
        .get(
          'achievements.xboxlive.com',
          `/users/xuid(${xid})/history/titles?orderBy=unlockTime`,
          {
            Authorization: 'XBL3.0 x=' + uhs + ';' + this._application.webToken.data.Token,
            'Accept-Language': preferred_game_language,
            'x-xbl-contract-version': 2,
            'x-xbl-client-name': 'XboxApp',
            'x-xbl-client-type': 'UWA',
            'x-xbl-client-version': '39.39.22001.0',
          },
        )
        .then((res: any) => {
          // log.info('[getHistoryAchivements] getHistoryAchivements:', JSON.stringify(res));
          if (res.titles) {
            resolve(res.titles);
          } else {
            resolve([]);
          }
        })
        .catch(e => {
          console.log('[getHistoryAchivements] error:', e);
          reject(e);
        });
    });
  }

  getAchivementDetail(titleId: string) {
    const http = new Http();
    const settings: any = this._application._store.get('settings', {})
    const preferred_game_language = settings.preferred_game_language || 'en-US'

    return new Promise((resolve, reject) => {
      const uhs = this._application.webToken.data.DisplayClaims.xui[0].uhs;
      const xid = this._application.webToken.data.DisplayClaims.xui[0].xid;

      http
        .get(
          'achievements.xboxlive.com',
          `/users/xuid(${xid})/achievements?titleId=${titleId}&maxItems=1000`,
          {
            Authorization: 'XBL3.0 x=' + uhs + ';' + this._application.webToken.data.Token,
            'Accept-Language': preferred_game_language,
            'x-xbl-contract-version': 2,
            'x-xbl-client-name': 'XboxApp',
            'x-xbl-client-type': 'UWA',
            'x-xbl-client-version': '39.39.22001.0',
          },
        )
        .then((res: any) => {
          if (res.achievements) {
            resolve(res.achievements);
          } else {
            resolve([]);
          }
        })
        .catch(e => {
          console.log('[getAchivementDetail] error:', e);
          reject(e);
        });
    });
  }
}