import Token from '../token'

export interface IStreamToken {
    offeringSettings: IOfferingSettings
    market: string
    gsToken: string
    tokenType: string
    durationInSeconds: number
}
  
export interface IOfferingSettings {
    allowRegionSelection: boolean
    regions: IRegion[]
    selectableServerTypes: any
    clientCloudSettings: IClientCloudSettings
}

export interface IRegion {
    name: string
    baseUri: string
    networkTestHostname: string
    isDefault: boolean
    systemUpdateGroups: any
    fallbackPriority: number
}

export interface IClientCloudSettings {
    Environments: IEnvironment[]
}

export interface IEnvironment {
    Name: string
    AuthBaseUri?: string
}  

export default class StreamingToken extends Token {

    public data:IStreamToken
    private _objectCreateTime = Date.now()

    constructor(tokenData:IStreamToken){
        super(tokenData)
        this.data = tokenData
    }

    calculateSecondsLeft(date:Date){
        const expiresOn = date
        const currentDate = new Date()
        return Math.floor((expiresOn.getTime() - currentDate.getTime()) / 1000)
    }

    getSecondsValid(){
        if(this._objectCreateTime + (this.data.durationInSeconds*1000)){
            return this.calculateSecondsLeft(new Date(this._objectCreateTime + (this.data.durationInSeconds*1000)))
        }

        return 0
    }

    isValid(){
        if(this._objectCreateTime + (this.data.durationInSeconds*1000)){
            const secondsLeft = this.calculateSecondsLeft(new Date(this._objectCreateTime + (this.data.durationInSeconds*1000)))
            return secondsLeft > 0
        }

        return false
    }

    getMarket(){
        return this.data.market
    }

    getRegions(){
        return this.data.offeringSettings.regions
    }

    getDefaultRegion(){
        return this.data.offeringSettings.regions.filter(region => region.isDefault)[0]
    }

    getEnvironments(){
        return this.data.offeringSettings.clientCloudSettings.Environments
    }
}