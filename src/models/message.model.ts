import {Entity, model, property} from '@loopback/repository';

/**
 * The model class is generated from OpenAPI schema - Message
 * Message
 */
@model({name: 'Message'})
export class Message extends Entity {
  constructor(data?: Partial<Message>) {
    super(data);
    if (data != null && typeof data === 'object') {
      Object.assign(this, data);
    }
  }


  @property({
    type: 'number',
    format: 'int32',
    id: true,
    generated: true,
    minimum: 0,
    maximum: 2147483647,
  })
  id?: number;

  /**
   *
   */
  @property({
    type: 'string',
    //id: true,
    //generated: false,
  })
  order_id: string;

  /**
   *
   */
  @property({
    type: 'string',
  })
  date: string;

  /**
   *
   */
  @property({
    type: 'number',
    format: 'int32',
    minimum: 0,
    maximum: 2147483647,
  })
  user_id: number;

  /**
   *
   */
  @property({
    type: 'string',
  })
  message: string;



}

export interface MessageRelations {
  // describe navigational properties here
}

export type MessageWithRelations = Message & MessageRelations;


