// Initialises the project-wide logger
import { logger } from './utils/logger';
import { parse_nagios_status_file } from './nagios/status/parser';
import fs from 'fs';
import ServiceStatus from './nagios/status/service_status_block';
import parse_nagios_config_file from './nagios/config/parser';
import Config, { parser_config_file } from "./config";
import map_service_to_transparent_feed from "./feeds/service_status/transparent";

// Polls nagios for the latest status information
async function poll_nagios_status(_: Config) {
  const stream = fs.createReadStream(
    `${__dirname}/../examples/nagios/example_status.dat`,
    'utf-8'
  );
  const status_iter = parse_nagios_status_file(stream);
  for await (const status of status_iter) {
    if (status !== null) {
      if (status.type === 'ServiceStatus') {
        logger.info(
          `Service Status with check_command ${status.status.check_command}`
        );
        const feed_result = map_service_to_transparent_feed(status.status);
        logger.info(
          feed_result,
          `Mapped service \`${status.status.service_description}\`@\`${status.status.host_name}\` to feed result`
        );
      }
    }
  }
}

async function app() {
  // Loads the config
  let config_file = fs.readFileSync(`${__dirname}/../examples/example_config.toml`, {encoding: "utf-8"});
  let config = parser_config_file(config_file);
  logger.debug(config, "Parsed config file:")

  // Reads the nagios config file
  const nagios_config_file = fs.createReadStream(
    `${__dirname}/../examples/nagios/nagios.cfg`,
    'utf-8'
  );
  const nagios_config = await parse_nagios_config_file(nagios_config_file);
  logger.info(nagios_config, 'Parsed nagios config file');

  await poll_nagios_status(config);
}

app().then(() => {});
