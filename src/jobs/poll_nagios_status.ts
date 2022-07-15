// Polls nagios for the latest status information
import {
  service_map_feed_key_function,
  ServiceFeedMap,
} from '../exposures/service';
import fs from 'fs';
import { parse_nagios_status_file } from '../nagios/status/parser';
import { logger } from '../utils/logger';
import FeedResult from '../feeds/feed_result';
import map_service_to_transparent_feed from '../feeds/service_status/transparent';

export async function poll_nagios_status(
  nagios_status_path: string,
  service_feed_map: ServiceFeedMap
) {
  // We can open a read-only stream as nagios will never overwrite it's contents
  const stream = fs.createReadStream(nagios_status_path, 'utf-8');
  for await (const status of parse_nagios_status_file(stream)) {
    if (status === null) {
    } else if (status.type === 'ServiceStatus') {
      // Gets the feed map of the service
      const feed_map = service_feed_map.get(
        service_map_feed_key_function(status.status)
      )?.feeds;
      if (feed_map === undefined) continue;
      // Evaluates all the feeds for the service
      for (const feed of feed_map) {
        let result: FeedResult | null = null;
        // Uses the corresponding feed function
        switch (feed.type) {
          case 'service:transparent':
            result = map_service_to_transparent_feed(status.status);
            break;
          case 'service:diagnostic:is_running':
            break;
          case 'service:plugin:ping':
            break;
        }
        logger.debug({
          message: `Evaluated feed result for ${service_map_feed_key_function(
            status.status
          )}`,
          feed: feed,
          result: result,
        });
      }
    }
  }
}
