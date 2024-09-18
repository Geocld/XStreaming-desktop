import IpcBase from './base'
import { defaultSettings } from '../../renderer/context/userContext.defaults'

export default class IpcSettings extends IpcBase {

    setSettings(args:(typeof defaultSettings)){
        return new Promise((resolve) => {
            const newSettings = {...defaultSettings, ...args}
            this._application._store.set('settings', newSettings)
            resolve(newSettings)
        })
    }

    getSettings(){
        return new Promise<typeof defaultSettings>((resolve) => {
            const settings = this._application._store.get('settings', defaultSettings) as object
            resolve({...defaultSettings, ...settings})
        })
    }

    resetSettings() {
        return new Promise((resolve) => {
            const settings = {...defaultSettings}
            this._application._store.delete('settings')

            this._application._store.set('settings', settings)
            resolve(settings)
        })
    }
}