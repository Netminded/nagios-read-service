// Initialises the project-wide logger
import { logger } from './utils/logger';
import { parse_nagios_status_file } from './nagios/status/parser';
import fs from 'fs';
import ServiceStatus from './nagios/status/service_status_block';
import parse_nagios_config_file from './nagios/config/parser';
import Config, { parse_config_file } from './config/config';
import map_service_to_transparent_feed from './feeds/service_status/transparent';
import Joi from 'joi';

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

// Gets the config from the config file
async function get_config(): Promise<Config | null> {
  try {
    // Loads the config
    let config = parse_config_file(
      fs.readFileSync(`${__dirname}/../examples/example_config.toml`, {
        encoding: 'utf-8',
      })
    );
    logger.info({
      message: 'Parsed config file',
      config: config,
    });
    return config;
  } catch (e) {
    if (e instanceof Joi.ValidationError) {
      logger.error({
        message: `Failed to parse config file; received error: '${e.message}'`,
        details: e.details,
      });
      return null;
    } else {
      throw e;
    }
  }
}

// Entrypoint
async function app() {
  let config = await get_config();
  if (config === null) return;

  // Reads the nagios config file
  const nagios_config = await parse_nagios_config_file(
    fs.createReadStream(config.nagios_config_file_path, 'utf-8')
  );
  logger.info({
    message: 'Parsed nagios config file',
    config: nagios_config,
  });

  await poll_nagios_status(nagios_config.status_file);
}

app().then(() => {});
