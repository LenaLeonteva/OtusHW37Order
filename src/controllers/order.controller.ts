import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Request, Response, RestBindings, api, operation, param, requestBody} from '@loopback/rest';
import {CONFIG} from '../config';
import {SvcConnector} from '../connectors/svc.connector';
import {BalanceReserve} from '../models/balance-reserve.model';
import {Message} from '../models/message.model';
import {Order} from '../models/order.model';
import {OrderRepository} from '../repositories';
import { CourierReserv } from '../models/courier-reserv.model';
import { ProductReserv } from '../models/product-reserv.model';
import { STATUS } from '../flow/check';
import {parse} from 'cookie';

/**
 * The controller class is generated from OpenAPI spec with operations tagged
 * by order.
 *
 */
@api({
  components: {
    schemas: {
      Order: {
        type: 'object',
        properties: {
          order_id: {
            type: 'string',
          },
          user_id: {
            type: 'number',
            format: 'int32',
          },
          price: {
            type: 'number',
            format: 'float',
          },
          product_id: {
            type: 'number',
            format: 'int32',
          },
          number: {
            type: 'number',
            format: 'int32',
          },
          completed: {
            type: 'boolean',
          },
          date: {
            type: 'string',
          },

        },
      },
      Error: {
        type: 'object',
        required: [
          'code',
          'message',
        ],
        properties: {
          code: {
            type: 'integer',
            format: 'int32',
          },
          message: {
            type: 'string',
          },
        },
      },
    },
    requestBodies: {
      OrderArray: {
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Order',
              },
            },
          },
        },
        description: 'List of user object',
        required: true,
      },
    },
  },
  paths: {},
})
export class OrderController {
  constructor(
    @repository(OrderRepository) private orderRepo: OrderRepository,
    @inject(RestBindings.Http.RESPONSE) private response: Response,
    @inject(RestBindings.Http.REQUEST) private request: Request
  ) {
    console.log('Hello from Order Controller')
  }
  /**
   *
   *
   * @param _requestBody Created order object
   */
  @operation('post', '/order/create', {
    tags: [
      'order',
    ],
    summary: 'Create order',
    operationId: 'createOrder',
    responses: {
      default: {
        description: 'successful operation',
      },
    },
    requestBody: {
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Order',
          },
        },
      },
      description: 'Created order object',
      required: true,
    },
  })
  async createOrder(@requestBody({
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Order',
        },
      },
    },
    description: 'Created order object',
    required: true,
  }) _requestBody: Order): Promise<any | undefined> {
    if (!(_requestBody.order_id)) {
      console.log("ERROR! Не указан идентификатор заказа");
      return this.response.status(400).send(this.errorRes(400, 'Не указан идентификатор заказа!'));
    }
    const orderID=_requestBody.order_id; 
    const filter = {
      where: {
        order_id: orderID,
      }
    };
    const sameOrder = await this.orderRepo.findOne(filter)
    if (sameOrder) {
      return this.response.status(400).send(this.errorRes(400, 'Это заказ уже был создан!'))
    }

    if (!_requestBody.user_id) return this.response.status(400).send(this.errorRes(400, 'Не указан идентификатор пользователя!'));

    let cookies = this.request.get("Set-cookie");
    if (!cookies) return this.response.status(403).send(this.errorRes(403, "Please go to login and provide Login/Password (no cookie)"));
    let objCookies = parse(cookies[0])
    console.log('obj with cookies:', objCookies);
    let sessionID = objCookies.session_id;
    if (!sessionID) return this.response.status(403).send(this.errorRes(403, "Please go to login and provide Login/Password (no cookie)"));

    let xuserid = this.request.get('X-UserId');
    if (!xuserid) return this.response.status(401).send(this.errorRes(401, "Please go to login and provide Login/Password"));
    if (+xuserid != _requestBody.user_id) return this.response.status(403).send(this.errorRes(403, "Forbidden"));

    _requestBody.status=STATUS.NEW;
    const newOrder = await this.orderRepo.create(_requestBody);

    //ПЛАТЁЖ
    let payment = new SvcConnector(CONFIG.payment.host, 60000, CONFIG.trace);
    let payReq = new BalanceReserve();
    payReq.order_id = orderID;
    payReq.user_id = _requestBody.user_id;
    payReq.price = _requestBody.price;

    let payRes = await payment.postReq(payReq);
    console.log(payRes);

    let notify = new SvcConnector(CONFIG.notify.host, 60000, CONFIG.trace);
    let message = new Message();
    message.order_id = orderID;
    message.user_id = _requestBody.user_id;
    message.date=new Date().toString();

    if (payRes.error) {
      //let payDel = await payment.delReq(payReq);
      await this.orderRepo.deleteById(orderID);
      console.log("Платеж не прошёл. Заказ отменён.");
      message.message = "Оплата не прошла. Недостаточно средств на счете. Заказ отменён."
      notify.postReq(message)
      return this.response.status(payRes.code ?? 500).send(payRes.message);
    }

    await this.orderRepo.updateById(_requestBody.order_id, {status: STATUS.PAID});

    //РЕЗЕРВ ТОВАРА
    let stock = new SvcConnector(CONFIG.stock.host, 60000, CONFIG.trace);
    let stockRec = new ProductReserv();
    stockRec.number = _requestBody.number;
    stockRec.order_id = _requestBody.order_id;
    stockRec.product_id = _requestBody.product_id;

    let stockRes = await stock.postReq(stockRec);
    console.log(stockRes);

    if (stockRes.error) {
      let payDel = await payment.delReq(payReq);
      await this.orderRepo.deleteById(orderID);
      //let stockDel = await payment.delReq(stockRec);
      console.log("Delete Payment", payDel);
      message.message = "Не удалось зарезервировать товар на складе. Деньги поступят на счет в течение 15 минут. Заказ отменён."
      notify.postReq(message)
      console.log(message.message)
      return this.response.status(stockRes.code ?? 500).send(stockRes.message);
    }

    await this.orderRepo.updateById(_requestBody.order_id, {status: STATUS.STOCK});

    //РЕЗЕРВ КУРЬЕРА
    let courier = new SvcConnector(CONFIG.delivery.host, 60000, CONFIG.trace);
    let courierRec = new CourierReserv();
    courierRec.date = _requestBody.date;
    courierRec.order_id = _requestBody.order_id;
    courierRec.courier_id = _requestBody.product_id;

    let courierRes = await courier.postReq(courierRec);
    console.log(courierRes);

    if (courierRes.error) {
      let stockDel = await stock.delReq(stockRec);
      console.log("Delete product reserve", stockDel);
      let payDel = await payment.delReq(payReq);
      console.log("Delete Payment", payDel);
      await this.orderRepo.deleteById(orderID);
      //let courierDel = await payment.delReq(courierRec);
      message.message = "Невозможно доставить товар по вашему адресу. Деньги поступят на счет в течение 15 минут. Заказ отменён."
      notify.postReq(message)
      console.log(message.message)
      return this.response.status(courierRes.code ?? 500).send(courierRes.message);
    }

    //const newOrder = await this.orderRepo.create(_requestBody);
    await this.orderRepo.updateById(_requestBody.order_id, {status: STATUS.COMPLETE});
    message.message = "Заказ оплачен";
    notify.postReq(message);
    delete newOrder.status;
    return newOrder;
  }
  /**
   * Returns order
   *
   * @param orderId ID of order
   * @returns order response
   */
  @operation('get', '/order/{orderId}', {
    tags: [
      'order',
    ],
    description: 'Returns order',
    operationId: 'find order by id',
    responses: {
      '200': {
        description: 'order response',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Order',
            },
          },
        },
      },
      default: {
        description: 'unexpected error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
    },
    parameters: [
      {
        name: 'orderId',
        in: 'path',
        description: 'ID of order',
        required: true,
        schema: {
          type: 'string',
        },
      },
    ],
  })
  async findOrderById(@param({
    name: 'orderId',
    in: 'path',
    description: 'ID of order',
    required: true,
    schema: {
      type: 'string',
    },
  }) orderId: string): Promise<Order> {
    let result=await this.orderRepo.findById(orderId);
    return result;
  }
  /**
   * deletes a single order based on the ID supplied
   *
   * @param orderId ID of order
   */
  @operation('delete', '/order/{orderId}', {
    tags: [
      'order',
    ],
    description: 'deletes a single order based on the ID supplied',
    operationId: 'deleteOrder',
    responses: {
      '204': {
        description: 'order deleted',
      },
      default: {
        description: 'unexpected error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
    },
    parameters: [
      {
        name: 'orderId',
        in: 'path',
        description: 'ID of order',
        required: true,
        schema: {
          type: 'string',
        },
      },
    ],
  })
  async deleteOrder(@param({
    name: 'orderId',
    in: 'path',
    description: 'ID of order',
    required: true,
    schema: {
      type: 'string',
    },
  }) orderId: string): Promise<unknown> {
    throw new Error('Not implemented');
  }

  errorRes(code: number, mes: string): any {
    return {
      statusCode: code,
      code: "error",
      message: mes
    }
  }
}

