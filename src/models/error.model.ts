import {model, property} from '@loopback/repository';

/**
 * The model class is generated from OpenAPI schema - Error
 * Error
 */
@model({name: 'Error'})
export class Error {
  constructor(data?: Partial<Error>) {
    if (data != null && typeof data === 'object') {
      Object.assign(this, data);
    }
  }

  /**
   *
   */
  @property({required: true, jsonSchema: {
  type: 'integer',
  format: 'int32',
  minimum: -2147483648,
  maximum: 2147483647,
}})
  code: number;

  /**
   *
   */
  @property({required: true, jsonSchema: {
  type: 'string',
}})
  message: string;

}

export interface ErrorRelations {
  // describe navigational properties here
}

export type ErrorWithRelations = Error & ErrorRelations;


