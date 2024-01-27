import {Entity, model, property} from '@loopback/repository';

/**
 * The model class is generated from OpenAPI schema - ProductReserv
 * ProductReserv
 */
@model({name: 'ProductReserv'})
export class ProductReserv extends Entity {
  constructor(data?: Partial<ProductReserv>) {
    super(data);
    if (data != null && typeof data === 'object') {
      Object.assign(this, data);
    }
  }

  /**
   *
   */
  @property({
    type: 'string',
    id: true,
    generated: false
  })
  order_id: string;

  /**
   *
   */
  @property({
    type: 'number',
    format: 'int32',
    minimum: 0,
    maximum: 2147483647,
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

}

export interface ProductReservRelations {
  // describe navigational properties here
}

export type ProductReservWithRelations = ProductReserv & ProductReservRelations;


