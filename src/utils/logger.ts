import pino from 'pino';

// Sets up the pino-pretty logger
export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});
