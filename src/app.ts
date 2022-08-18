#!/usr/bin/node

// Initialises the project-wide logger
import { logger } from './utils/logger';
import fs from 'fs';
import Config, { parse_config_file } from './parsers/service/config';
import { ValidationError } from 'joi';

import {
  collect_nagios_objects,
  NagiosObjects,
} from './parsers/nagios/object_cache/parser';
import parse_nagios_config_file, {
  NagiosConfig,
} from './parsers/nagios/config';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';
import { ApiKeys, extract_api_keys } from './dashboard_api/api_key';
import FeedResult from './feeds/result_maps/feed_result';
import Feed from './feeds/feed';
import { batch_api_upsert } from './dashboard_api/upsert';
import { ExposureMap, map_exposures } from './feeds/exposures/exposures';
import start_refresh_token_job from './jobs/refresh_token';
import start_poll_job from './jobs/poll_nagios';

// Gets the config from the config file, handles any errors
// If this function fails to return Config, then the process should exit
async function get_config(
  config_file_path: string
): Promise<Config | undefined> {
  try {
    // Loads the config
    const config = parse_config_file(
      fs.readFileSync(config_file_path, {
        encoding: 'utf-8',
      })
    );
    logger.debug({
      message: 'Parsed config file: ',
      config: config,
    });
    logger.info('Successfully parsed the config file');
    return config;
  } catch (e) {
    // Handle specific errors
    if (e instanceof ValidationError) {
      logger.error({
        message: `Cannot proceed. Failed to parse config file; received error: '${e.message}'`,
        details: e.details,
      });
    } else if (e instanceof Error) {
      logger.error({
        message: `Cannot proceed. Received error: ${e.message}`,
        error: e,
      });
    } else {
      logger.error(e);
    }
    return;
  }
}

// Gets the current nagios config
// If this function fails to return NagiosConfig, then the process should exit
async function get_nagios_config(
  config: Config
): Promise<NagiosConfig | undefined> {
  try {
    const nagios_config = await parse_nagios_config_file(
      fs.createReadStream(config.nagios_config_file_path, 'utf-8')
    );
    logger.debug({
      message: 'Parsed nagios config file: ',
      nagios_config: nagios_config,
    });
    logger.info('Successfully parsed that nagios config file');
    return nagios_config;
  } catch (e) {
    // Handle specific errors
    if (e instanceof ValidationError) {
      logger.error({
        message: `Cannot proceed. Failed to parse nagios config file; received error: '${e.message}'`,
        details: e.details,
      });
    } else if (e instanceof Error) {
      logger.error({
        message: `Cannot proceed. Received error: ${e.message}`,
        error: e,
      });
    } else {
      logger.error(e);
    }
    return;
  }
}

// Gets the current nagios objects
// If this function fails to return NagiosObjects, then the process should exit
async function get_nagios_objects(
  nagios_config: NagiosConfig
): Promise<NagiosObjects | undefined> {
  try {
    const objects = await collect_nagios_objects(
      fs.createReadStream(nagios_config.object_cache_file, 'utf-8')
    );
    logger.info('Successfully parsed the nagios object cache file');
    return objects;
  } catch (e) {
    // Handle specific errors
    if (e instanceof ValidationError) {
      logger.error({
        message: `Cannot proceed. Failed to parse nagios object cache file; received error: '${e.message}'`,
        details: e.details,
      });
    } else if (e instanceof Error) {
      logger.error({
        message: `Cannot proceed. Received error: ${e.message}`,
        error: e,
      });
    } else {
      logger.error(e);
    }
    return;
  }
}

async function handle_batch_upsert(
  config: Config,
  api_keys: ApiKeys,
  dry_run: boolean,
  feeds: [Feed, FeedResult][]
) {
  if (dry_run) {
    for (const [feed, result] of feeds) {
      logger.info({
        message: '[Dry] Upserting feed: ',
        feed: feed,
        result: result,
      });
    }
  } else {
    logger.info('Batch upserting feeds');
    const key_batches: { [key: string]: [Feed, FeedResult][] } = {};
    for (const name in api_keys) key_batches[name] = [];
    // Sorts the batch into their respective api key batches
    for (const [feed, result] of feeds) {
      key_batches[feed.api_key_name].push([feed, result]);
    }

    // Batch upserts each feed
    for (const name in key_batches) {
      const token = api_keys[name].token;
      logger.debug({
        message: `Key undefined? ${token === undefined}`,
        key_name: name,
        key: api_keys[name],
      });
      if (token === undefined) continue;

      // Gets the batch
      const batch = key_batches[name];

      try {
        await batch_api_upsert(
          new URL(config.api.upsert_endpoint),
          token,
          batch
        );
      } catch (e) {
        if (e instanceof Error)
          logger.error({
            message: `Received error '${e.message}', skipping upsert of this batch`,
            error: e,
          });
        else logger.error(e);
      }
    }
  }
}

// Entrypoint
async function start(config_file_path: string, dry_run: boolean) {
  // Reads the config file
  const config = await get_config(config_file_path);
  if (config === undefined) return;

  // Reads the nagios config file
  const nagios_config = await get_nagios_config(config);
  if (nagios_config === undefined) return;

  // Loads the nagios object cache
  const nagios_objects = await get_nagios_objects(nagios_config);
  if (nagios_objects === undefined) return;

  // Gets the feeds
  // @ts-ignore -- If it doesn't get defined below, we exit
  let feeds: ExposureMap;
  try {
    feeds = map_exposures(config, nagios_objects);
  } catch (e) {
    if (e instanceof Error) {
      logger.error(`Received error while generating feeds; ${e.message}`);
    }
    return;
  }
  logger.debug({
    message: 'Feed exposures: ',
    service_map: [...feeds.service_map.entries()],
    host_map: [...feeds.host_map.entries()],
  });

  // Api Key management
  const api_keys: ApiKeys = extract_api_keys(config);
  // Refreshes tokens
  if (!dry_run) start_refresh_token_job(config, api_keys);

  // Starts the actual nagios polling
  start_poll_job(config, nagios_config, feeds, async (feeds) => {
    await handle_batch_upsert(config, api_keys, dry_run, feeds);
  });
}

// Parses the command line arguments
yargs(hideBin(process.argv))
  .command(
    'start',
    'Start the service',
    (yargs) => {
      yargs
        .option('config', {
          alias: 'c',
          type: 'string',
          default: '/etc/netminded/nagios-read-service/config.toml',
          description: "The path to the service's config file",
        })
        .coerce('config', path.resolve);
      yargs.option('dry-run', {
        type: 'boolean',
        default: false,
        description: 'If true, then there is no interaction with the api',
      });
    },
    (argv) => {
      start(<string>argv.config, <boolean>argv.dryRun).then(() => {
        logger.info('Closing');
      });
    }
  )
  .demandCommand()
  .parse();
