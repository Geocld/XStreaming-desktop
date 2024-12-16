import Application from '../application';
import Http from './xhttp';

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