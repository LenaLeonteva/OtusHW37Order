import {Entity, model, property} from '@loopback/repository';

/**
 * The model class is generated from OpenAPI schema - Order
 * Order
 */
@model({name: 'Order'})
export class Order extends Entity {
  constructor(data?: Partial<Order>) {
    super(data)
    if (data != null && typeof data === 'object') {
      Object.assign(this, data);
    }
  }

  /**
   *
   */
  @property({
    id: true,
    generated: 'false',
    type: 'string'
  })
  order_id?: string;

  /**
   *
   */
  @property({
    type: 'number',
    format: 'int32',
    minimum: 0,
    maximum: 2147483647,
  })
  user_id?: number;

  /**
   *
   */
  @property({
    type: 'number',
    format: 'float',
    minimum: 0,
    maximum: 3.402823669209385e+38,
  })
  price?: number;

  /**
     *
     */
  @property({
    type: 'number',
    format: 'int32',
    minimum: 0,
    maximum: 2147483647,
    generated: true
  })
  product_id?: number;

  /**
  *
  */
  @property({
    type: 'number',
    format: 'int32',
    minimum: 0,
    maximum: 2147483647,
  })
  number?: number;

  /**
  *
  */
  @property({
    type: 'boolean',
  })
  completed?: boolean;

  /**
   *
   */
  @property({
    type: 'string',
  })
  date?: string;

}

export interface OrderRelations {
  // describe navigational properties here
}

export type OrderWithRelations = Order & OrderRelations;


