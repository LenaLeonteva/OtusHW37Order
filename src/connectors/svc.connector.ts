import {AxiosRequestConfig} from "axios";
import {BalanceReserve} from '../models/balance-reserve.model';
import {CourierReserv} from '../models/courier-reserv.model';
import {ProductReserv} from '../models/product-reserv.model';
import {Connector, ConnectorResponse, ConnectorResponseStatus} from "./connector";
import {WinstonLoggerWrapper} from './winston-logger-wrapper';

export class SvcConnector extends Connector {
  private readonly url: string;
  private readonly timeout: number;
  constructor(url: string, timeout: number, trace: boolean) {
    super();
    this.url = url
    this.timeout = timeout
    super.setTrace(trace)
  }

  //любой запрос post
  async postReq(request: BalanceReserve | ProductReserv | CourierReserv): Promise<Res> {
    const req = JSON.stringify(request)
    const options: AxiosRequestConfig = this.createOptions(req);
    const resp: ConnectorResponse = await super.post(options)
    const result = this.SvcResponse(resp, request.order_id);
    if (!result) return {error: true, code: 500, message: "Unknown error"};
    return result
  }

  //любой запрос post
  async delReq(request: BalanceReserve | ProductReserv | CourierReserv): Promise<Res> {
    const req = JSON.stringify(request)
    const options: AxiosRequestConfig = this.createOptions(req);
    const resp: ConnectorResponse = await super.delete(options)
    const result = this.SvcResponse(resp, request.order_id);
    if (!result) return {error: true, code: 500, message: "Unknown error"};
    return result
  }

  private createOptions(data?: string): AxiosRequestConfig {

    const options: AxiosRequestConfig = {
      url: this.url,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      },
    }
    if (data) {
      options.data = data
    }
    return options
  }

  private SvcResponse(response: ConnectorResponse, orderID: string): Res {

    switch (response.status) {
      case ConnectorResponseStatus.SUCCESS:
        if (response.httpStatusCode === 200) {
          return {error: false, code: 200, message: response.data};
        }

      default:
        return {error: true, code: response.httpStatusCode, message: response.data}
      //return this.logErrors(response, orderID)
    }

  }

  private logErrors(response: ConnectorResponse, orderID: string) {
    const winstonWrapper = new WinstonLoggerWrapper();
    let errStr = 'Не удалось соединиться с сервером для получения информации!'
    switch (response.status) {
      case ConnectorResponseStatus.OPERATION_ERROR:
        let errMes = ""
        errMes = response.httpStatusCode + ', ' + response.httpStatusCode + ', ' + response.error;
        winstonWrapper.log('error', "ОШИБКА! OPERATION_ERROR! orderID = " + orderID + " Не получена информация! " + errMes);
        return errMes;
      case ConnectorResponseStatus.TIMEOUT_ERROR:
        winstonWrapper.log('error', "ОШИБКА! TIMEOUT_ERROR!  orderID = " + orderID + " " + errStr);
        return 504 + ', ' + "TIMEOUT_ERROR, " + errStr;
      case ConnectorResponseStatus.CONNECTION_ERROR:
        winstonWrapper.log('error', "ОШИБКА! CONNECTION_ERROR! orderID = " + orderID + " " + errStr);
        return 500 + ', ' + "CONNECTION_ERROR, " + errStr;
      case ConnectorResponseStatus.CONFIG_ERROR:
        winstonWrapper.log('error', "ОШИБКА! CONFIG_ERROR! orderID = " + orderID + " " + errStr);
        return 501 + ', ' + "CONFIG_ERROR, " + errStr;
      default:
        winstonWrapper.log('error', "ОШИБКА! UNKNOWN_ERROR! orderID = " + orderID + " " + errStr);
        return 500 + ', ' + "UNKNOWN_ERROR, " + errStr;
    }

  }
}

export interface Req {
  readonly id: string,
  readonly type: string,
  readonly request: any
}

export interface Res {
  readonly error: boolean,
  code?: number,
  message?: any,
}


export interface RegisterClientRes {
  readonly HttpResponseStatusCode: number,
}


