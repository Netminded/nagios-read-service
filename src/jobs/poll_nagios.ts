import * as schedule from 'node-schedule';
import { logger } from '../utils/logger';
import { poll_nagios_status } from '../nagios/poll_nagios_status';
import Config from '../config/config';
import { ExposureMap } from '../exposures/exposures';
import FeedResult from '../feeds/feed_result';
import Feed from '../feeds/feed';
import { NagiosConfig } from '../nagios/config/parser';

export type BatchUpsert = (feeds: [Feed, FeedResult][]) => Promise<void>;

export default function start_poll_job(
  config: Config,
  nagios_config: NagiosConfig,
  exposure_map: ExposureMap,
  batch_upsert_function: BatchUpsert
) {
  logger.info("Starting 'Poll Nagios Status' job");
  return schedule.scheduleJob('* * * * *', async function () {
    logger.info("Polling nagios for status' and syncing with SeeThru");

    // Diagnostic info
    let diagnostics = {
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
        // @ts-ignore
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
      `Upserted (${diagnostics.feeds_upserted}) feeds in (${diagnostics.batches_upserted}) batch(es)`
    );
  });
}
