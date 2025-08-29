import axios from 'axios'
import type { AxiosResponse, Canceler } from 'axios'

import { getData } from './utils'

axios.defaults.withCredentials = false

export interface RequestsConfig {
    host?: string
}

export interface RequestsOptions {
    host?: string
    url: string,
    data?: object,
    json?: object,
    headers?: { [key: string]: string }
}

export default class Requests {
    host: string
    cancelTokens: Array<{ cancel: Canceler }>

    constructor(config?: RequestsConfig) {
        this.host = config && config.host ? config.host : location.host
        this.cancelTokens = []
    }

    async httpRequests<T>(method: string, options: RequestsOptions): Promise<AxiosResponse<T>> {
        const url = options.url
        const data = options.data || {}

        const post = ['PUT', 'POST', 'PATCH'].indexOf(method.toUpperCase()) >= 0

        const params = post ? 'data' : 'params'
        const payload = post && options.json ? JSON.stringify(data) : data

        const headers: { [key: string]: string } = {
            'Content-Type': 'application/json',
            ...options.headers || {}
        }

        const token = getData<string>('access_token')
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        const config = {
            url: (options.host || this.host) + url,
            method,
            headers,
            cancelToken: new axios.CancelToken(cancel => {
                this.cancelTokens.push({ cancel })
            }),
            [params]: payload
        }

        // for (const name in headers) {
        //     config.headers[name] = headers[name]
        // }
        return axios<T>(config)
    }

    async get<T>(options: RequestsOptions) {
        return await this.httpRequests<T>('get', options)
    }

    async post<T>(options: RequestsOptions): Promise<AxiosResponse<T>> {
        return await this.httpRequests<T>('POST', options)
    }
}
