import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: 'info', // Defaults to info logger
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  ],
});
