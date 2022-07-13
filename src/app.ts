// Initialises the project-wide logger
import { logger } from './utils/logger';
import { parse_nagios_status_file } from './nagios/status/parser';
import fs from 'fs';
import ServiceStatus from './nagios/status/service_status_block';
import parse_nagios_config_file from './nagios/config/parser';
import { parser_config_file } from './config';
import map_service_to_transparent_feed from './feeds/service_status/transparent';

// Polls nagios for the latest status information
async function poll_nagios_status(nagios_status_path: string) {
  // We can open a read-only stream as nagios will never overwrite it's contents
  const stream = fs.createReadStream(nagios_status_path, 'utf-8');
  for await (const status of parse_nagios_status_file(stream)) {
    if (status === null) {
    } else if (status.type === 'ServiceStatus') {
      logger.debug({
        message: 'Received service status from nagios, mapping to feeds',
        status: status,
      });
      const feed_result = map_service_to_transparent_feed(status.status);
      logger.info({
        message: `Mapped service \`${status.status.service_description}\`@\`${status.status.host_name}\` to feed result`,
        result: feed_result,
      });
    }
  }
}

async function app() {
  // Loads the config
  let config = parser_config_file(
    fs.readFileSync(`${__dirname}/../examples/example_config.toml`, {
      encoding: 'utf-8',
    })
  );
  logger.debug({
    message: 'Parse config file',
    config: config,
  });

  // Reads the nagios config file
  const nagios_config = await parse_nagios_config_file(
    fs.createReadStream(`${__dirname}/../examples/nagios/nagios.cfg`, 'utf-8')
  );
  logger.info({
    message: 'Parsed nagios config file',
    config: nagios_config,
  });

  await poll_nagios_status(
    `${__dirname}/../examples/nagios/example_status.dat`
  );
}

app().then(() => {});
