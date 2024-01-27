import {format} from '@loopback/logging';


/* Уровни логирования winston по умолчанию. По ним смотрим что нужно логировать, а что нет*/
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

export class WinstonLoggerWrapper {
  private winston = require('winston');

  public winstonLogger = this.winston.createLogger({
    level: logLevels.verbose,
    format: format.combine(
      format.splat(),
      format.json(),
      format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
      // Format the metadata object
      format.metadata({fillExcept: ['message', 'level', 'timestamp', 'label']})
    ),
    defaultMeta: {service: 'life-insurance'},
  });
  public log = this.logFunc;

  constructor() {
    //
    // If we're not in production then log to the `console` with the format:
    // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
    //
    if (process.env.NODE_ENV !== 'production') {
      this.winstonLogger.add(new this.winston.transports.Console({
        format: this.winston.format.simple(),
      }));
    }
  }

  private logFunc(level: string, message: string | Object, metadata?: unknown): void {
    const logLevelNum = (<any>logLevels)[level];

    //Если уровень логирования больше ограничения LOG_LEVEL, то записываем в лог
    if (logLevelNum <= (<any>logLevels)[logLevels.verbose]) {
      this.winstonLogger.log(level, message, {
        metadata: metadata,
        message: message,
      });
    }

  }
}
