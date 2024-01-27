import {Entity, model, property} from '@loopback/repository';

/**
 * The model class is generated from OpenAPI schema - CourierReserv
 * CourierReserv
 */
@model({name: 'CourierReserv'})
export class CourierReserv extends Entity {
  constructor(data?: Partial<CourierReserv>) {
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
  generated: false,
})
  order_id: string;

  /**
   *
   */
  @property({
  type: 'number',
  format: 'int32',
})
  courier_id?: number;

  /**
   *
   */
  @property({
  type: 'string',
})
  date?: string;

}

export interface CourierReservRelations {
  // describe navigational properties here
}

export type CourierReservWithRelations = CourierReserv & CourierReservRelations;


