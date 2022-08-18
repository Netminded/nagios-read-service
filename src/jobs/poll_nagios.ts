import * as schedule from 'node-schedule';
import { logger } from '../utils/logger';
import Config from '../parsers/service/config';
import { ExposureMap } from '../feeds/exposures/exposures';
import FeedResult from '../feeds/result_maps/feed_result';
import Feed from '../feeds/feed';
import { NagiosConfig } from '../parsers/nagios/config';
import { BatchUpsert } from '../feeds/upsert';
import fs from 'fs';
import { parse_nagios_status_file } from '../parsers/nagios/status/parser';
import { map_nagios_status_to_feed } from '../feeds/result_maps/map_nagios_status';

// A generator which yields feeds and their corresponding results for all
// status' in the nagios status file
async function* poll_nagios_status(
  nagios_status_path: string,
  exposure_map: ExposureMap
): AsyncGenerator<[Feed, FeedResult]> {
  // We can open a read-only stream as nagios will never overwrite it's contents
  const stream = fs.createReadStream(nagios_status_path, 'utf-8');

  for await (const status of parse_nagios_status_file(stream)) {
    if (status !== null) yield* map_nagios_status_to_feed(status, exposure_map);
  }
}

export default function start_poll_job(
  config: Config,
  nagios_config: NagiosConfig,
  exposure_map: ExposureMap,
  batch_upsert_function: BatchUpsert
) {
  logger.info("Starting 'Poll Nagios Status' job");
  return schedule.scheduleJob(config.poll_cron, async function () {
    logger.info("Polling nagios for status' and syncing with SeeThru");

    try {
      // Diagnostic info
      const diagnostics = {
        feeds_upserted: 0,
        batches_upserted: 0,
      };

      // Batches results together for efficient upsert
      let batch: [Feed, FeedResult][] = [];
      for await (const feed_result of poll_nagios_status(
        nagios_config.status_file,
        exposure_map
      )) {
        batch.push(feed_result);
        // Checks if the batch should be upserted
        if (batch.length == config.batch_size) {
          await batch_upsert_function(batch);
          diagnostics.feeds_upserted += 25;
          diagnostics.batches_upserted += 1;
          batch = [];
        }
      }
      // Upsert the final batch
      if (batch.length > 0) {
        await batch_upsert_function(batch);
        diagnostics.feeds_upserted += batch.length;
        diagnostics.batches_upserted += 1;
      }
      logger.info(
        `Upserted (${diagnostics.feeds_upserted}) feeds with (${diagnostics.batches_upserted}) batch(es)`
      );
    } catch (e) {
      if (e instanceof Error)
        logger.error({
          message: `Received error '${e.message}', skipping this poll`,
          error: e,
        });
      else logger.error(e);
    }
  });
}
