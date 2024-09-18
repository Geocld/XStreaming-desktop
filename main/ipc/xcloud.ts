import IpcBase from './base'
import Application from '../application'
import TitleManager from '../helpers/titlemanager'
import xCloudApi from '../helpers/xcloudapi'

interface getTitleArgs {
    titleId: string;
}

export default class IpcxCloud extends IpcBase {

    _titleManager:TitleManager

    _titlesAreLoaded = false

    _titles = []
    _titlesLastUpdate = 0

    _recentTitles = []
    _recentTitlesLastUpdate = 0

    _newTitles = []
    _newTitlesLastUpdate = 0

    constructor(application:Application){
        super(application)

        this._titleManager = new TitleManager(application)
    }

    startUp(){
        this._application.log('Ipc:xCloud', 'Starting xCloud IPC Channel...')
    }

    getRecentTitles(){
        const streamingTokens = this._application.streamingTokens;
        const _xCloudApi = new xCloudApi(
            this._application,
            streamingTokens.xCloudToken.getDefaultRegion().baseUri.substring(8),
            streamingTokens.xCloudToken.data.gsToken,
            "cloud"
        );
        return _xCloudApi.getRecentTitles()
    }

    getXhomeToken() {
        console.log('getXhomeToken')
        return new Promise(resolve => {
            if (this._application.streamingTokens && this._application.streamingTokens.xHomeToken) {
                resolve(this._application.streamingTokens.xHomeToken.data)
            } else {
                resolve(null)
            }
        })
    }

    setXhomeTokenDefault(name: string) {
        this._application.streamingTokens.xHomeToken.setDefaultRegion(name)
    }

    getXcloudToken() {
        console.log('getXcloudToken')
        return new Promise(resolve => {
            if (this._application.streamingTokens && this._application.streamingTokens.xCloudToken) {
                resolve(this._application.streamingTokens.xCloudToken.data)
            } else {
                resolve(null)
            }
        })
    }

    setXcloudTokenDefault(name: string) {
        if (this._application.streamingTokens.xCloudToken) {
            this._application.streamingTokens.xCloudToken.setDefaultRegion(name)
        }
    }

    getTitles() {
        const streamingTokens = this._application.streamingTokens;
        const _xCloudApi = new xCloudApi(
            this._application,
            streamingTokens.xCloudToken.getDefaultRegion().baseUri.substring(8),
            streamingTokens.xCloudToken.data.gsToken,
            "cloud"
        );
        return new Promise((resolve, reject) => {
            _xCloudApi.getTitles().then((titles: any) => {
                resolve(titles)
            })
            .catch((error) => {
                reject(error)
            })
        })
    }

    getGamePassProducts(titles: any) {
        return this._titleManager.getGamePassProducts(titles)
    }

    getNewTitles(){
        return this._titleManager.getNewTitles()
    }
}