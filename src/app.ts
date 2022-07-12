// Initialises the project-wide logger
import { logger } from './logger';
import { parse_nagios_status_file } from './parse_nagios_status_dat';
import fs from 'fs';

async function app() {
  const stream = fs.createReadStream(
    `${__dirname}/../examples/example_status.dat`,
    'utf-8'
  );
  const status_iter = parse_nagios_status_file(stream);
  for await (const status of status_iter) {
    logger.info(status);
  }
  logger.info('Hello World');
}

app().then(() => {});
