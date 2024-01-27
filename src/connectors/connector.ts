import axios, {AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosResponseHeaders, RawAxiosResponseHeaders} from "axios";

export class Connector {
  private instance: AxiosInstance
  private readonly TIMEOUT: number = 30000;
  private readonly GET: string = 'GET'
  private readonly POST: string = 'POST'
  private readonly DELETE: string = 'DELETE'
  private TRACE: boolean = true;

  constructor() {
    this.instance = axios.create({
      validateStatus: function (status) {
        return status >= 200 && status < 300
      },
      timeout: this.TIMEOUT
    })
  }

  protected post(options: AxiosRequestConfig): Promise<ConnectorResponse> {
    options.method = this.POST
    return this.send(options)
  }

  protected delete(options: AxiosRequestConfig): Promise<ConnectorResponse> {
    options.method = this.DELETE
    return this.send(options)
  }

  protected get(options: AxiosRequestConfig): Promise<ConnectorResponse> {
    options.method = this.GET
    delete options.data
    return this.send(options)
  }

  protected send(options: AxiosRequestConfig) {
    return new Promise<ConnectorResponse>((resolve) => {
      this.prepareForEgress(options)
      this.instance.request(options)
        .then((response: AxiosResponse) => {
          const resp: ConnectorResponse = {
            status: ConnectorResponseStatus.SUCCESS,
            data: response.data,
            headers: response.headers,
            httpStatusCode: response.status
          }
          this.logMessage(options, resp)
          resolve(resp)
        })
        .catch((error: AxiosError) => {
          if (error.response) {
            const errorMessage = `${error.code}, ${error.message}`
            const resp: ConnectorResponse = {
              status: ConnectorResponseStatus.OPERATION_ERROR,
              //data: `${error.response.data}`,
              data: JSON.stringify(error.response.data),
              headers: error.response.headers,
              httpStatusCode: error.response.status,
              error: errorMessage
            }
            this.logMessage(options, resp)
            resolve(resp)
          } else if (error.request) {
            const errorMessage = `${error.code}, ${error.message}`

            const status: ConnectorResponseStatus = error.code === AxiosError.ECONNABORTED
              ? ConnectorResponseStatus.TIMEOUT_ERROR
              : ConnectorResponseStatus.CONNECTION_ERROR

            const resp: ConnectorResponse = {
              status: status,
              error: errorMessage
            }
            this.logMessage(options, resp)
            resolve(resp)
          } else {
            const resp: ConnectorResponse = {
              status: ConnectorResponseStatus.CONFIG_ERROR,
              error: error.message
            }
            this.logMessage(options, resp)
            resolve(resp)
          }
        })
    })
  }

  private prepareForEgress(options: AxiosRequestConfig) {
    if (!options.headers) options.headers = {}
  }


  private logMessage(options: AxiosRequestConfig, response: ConnectorResponse) {
    if (this.TRACE) {
      delete options.httpsAgent
      const log: logMessage = {
        request: options,
        response: response
      }
      console.log('INVOKE', log);
    }
  }

  protected setTrace(value: boolean) {
    this.TRACE = value;
  }
}

interface logMessage {
  readonly request: AxiosRequestConfig,
  readonly response: ConnectorResponse
}

export interface ConnectorResponse {
  readonly status: ConnectorResponseStatus
  readonly httpStatusCode?: number
  readonly headers?: AxiosResponseHeaders | RawAxiosResponseHeaders
  readonly data?: any
  readonly error?: string
}

export enum ConnectorResponseStatus {
  SUCCESS = 'SUCCESS',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  OPERATION_ERROR = 'OPERATION_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR'
}
