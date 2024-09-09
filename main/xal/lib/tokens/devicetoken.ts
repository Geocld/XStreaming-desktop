import Token from '../token'

export interface IDeviceCode {
    IssueInstant: string
    NotAfter: string
    Token: string
    DisplayClaims: {
        xui: {
            uhs: string
        }
    }
}

export default class DeviceToken extends Token {
    data:IDeviceCode

    constructor(data:IDeviceCode) {
        super(data)
        this.data = data
    }

    getSecondsValid(){
        return this.calculateSecondsLeft(new Date(this.data.NotAfter))
    }

    isValid(){

        if(this.calculateSecondsLeft(new Date(this.data.NotAfter)) <= 0){
            return false
        }

        return true
    }
}