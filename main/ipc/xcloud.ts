import IpcBase from './base'
import Application from '../application'
import TitleManager from '../helpers/titlemanager'

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
        return this._application._xCloudApi.getRecentTitles()
    }

    getTitles(){
        return new Promise((resolve, reject) => {
            this._application._xCloudApi.getTitles().then((titles: any) => {
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