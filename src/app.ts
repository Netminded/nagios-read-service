// Initialises the project-wide logger
import { logger } from './utils/logger';
import fs from 'fs';
import Config, { parse_config_file } from './config/config';
import Joi, { ValidationError } from 'joi';

import {
  collect_nagios_objects,
  NagiosObjects,
} from './nagios/object_cache/parser';
import parse_nagios_config_file, { NagiosConfig } from './nagios/config/parser';
import { map_services_to_feeds } from './exposures/service';
import start_poll_job from './jobs/poll_nagios';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';

// Gets the config from the config file
async function get_config(config_file_path: string): Promise<Config | null> {
  try {
    // Loads the config
    let config = parse_config_file(
      fs.readFileSync(config_file_path, {
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

// Gets the current nagios objects
async function get_nagios_objects(
  nagios_config: NagiosConfig
): Promise<NagiosObjects | null> {
  try {
    const stream = fs.createReadStream(
      nagios_config.object_cache_file,
      'utf-8'
    );
    return await collect_nagios_objects(stream);
  } catch (e) {
    // Handle specific errors
    if (e instanceof ValidationError) {
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
async function start(config_file_path: string) {
  let config = await get_config(config_file_path);
  if (config === null) return;

  // Reads the nagios config file
  const nagios_config = await parse_nagios_config_file(
    fs.createReadStream(config.nagios_config_file_path, 'utf-8')
  );
  logger.info({
    message: 'Parsed nagios config file',
  });

  // Loads the nagios object cache
  let nagios_objects = await get_nagios_objects(nagios_config);
  if (nagios_objects === null) return;
  // Calculates the mapping of service to feeds
  let service_feed_map = await map_services_to_feeds(
    config,
    nagios_objects.services
  );
  logger.info({
    message: `Mapped services to feeds; found ${service_feed_map.size} mappings`,
  });

  start_poll_job(
    config,
    nagios_config,
    {
      service_map: service_feed_map,
    },
    async (feeds) => {
      for (const [feed, result] of feeds) {
        logger.info({
          message: 'Upserting feed: ',
          feed: feed,
          result: result,
        });
      }
    }
  );
}

yargs(hideBin(process.argv))
  .command(
    'start',
    'Start the service',
    (yargs) => {
      yargs
        .option('config', {
          alias: 'c',
          type: 'string',
          default: '/etc/netminded/nagios/config.toml',
          description: "The path of the service's config file",
        })
        .coerce('config', path.resolve);
    },
    (argv) => {
      // @ts-ignore
      start(argv.config).then(() => {});
    }
  )
  .demandCommand()
  .parse();
