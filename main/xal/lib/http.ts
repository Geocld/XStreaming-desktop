import { IncomingHttpHeaders } from 'http'
import https from 'https'

export default class Http {

    getRequest(host, path, headers) {
        return new Promise<HttpResponse>((resolve, reject) => {

            const hostHeaders = {
                // 'Content-Type': 'application/json',
                ...headers,
            }

            const options = {
                method: 'GET',
                hostname: host,
                path: path,
                port: 443,
                headers: hostHeaders
            }

            const req = https.request(options, (res) => {
                let responseData = ''
                
                res.on('data', (data) => {
                    responseData += data
                })

                res.on('close', () => {
                    if(res.statusCode == 200 || res.statusCode == 204){
                        if(responseData.toString() === ''){
                            resolve(new HttpResponse({}, res.headers))
                        } else {
                            resolve(new HttpResponse(JSON.parse(responseData.toString()), res.headers))
                        }
                    } else {
                        reject({
                            statuscode: res.statusCode,
                            headers: res.headers,
                            body: responseData.toString(),
                            message: 'Error fetching '+host+path
                        })
                    }
                })
            })
            
            req.on('error', (error) => {
                reject(error)
            })

            req.end()

        })
    }

    postRequest(host, path, headers, data) {
        return new Promise<HttpResponse>((resolve, reject) => {

            const hostHeaders = {
                // 'Content-Type': 'application/json',
                ...headers,
            }

            if(typeof data === 'object'){
                data = JSON.stringify(data)
            }

            const options = {
                method: 'POST',
                hostname: host,
                path: path,
                port: 443,
                headers: hostHeaders
            }

            // console.log(options, data)

            const req = https.request(options, (res) => {
                let responseData = ''
                
                res.on('data', (data) => {
                    responseData += data
                })

                res.on('close', () => {
                    if(res.statusCode == 200 || res.statusCode == 202){
                        if(responseData.toString() === ''){
                            resolve(new HttpResponse({}, res.headers))
                        } else {
                            resolve(new HttpResponse(JSON.parse(responseData.toString()), res.headers))
                        }
                    } else {
                        reject({
                            statuscode: res.statusCode,
                            headers: res.headers,
                            body: responseData.toString(),
                            message: 'Error fetching '+host+path
                        })
                    }
                })
            })
            
            req.on('error', (error) => {
                reject(error)
            })

            req.write(data)
            req.end()

        })
    }
}


export class HttpResponse {

    data:any
    headers:IncomingHttpHeaders

    constructor(data:any, headers:IncomingHttpHeaders){
        this.data = data
        this.headers = headers
    }

    header(){
        return this.headers
    }

    body(){
        return this.data
    }
}