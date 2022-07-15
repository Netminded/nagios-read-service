// Polls nagios for the latest status information
import {
  service_map_feed_key_function,
  ServiceFeedMap,
} from '../exposures/service';
import fs from 'fs';
import { parse_nagios_status_file } from '../nagios/status/parser';
import { logger } from '../utils/logger';

export async function poll_nagios_status(
  nagios_status_path: string,
  service_feed_map: ServiceFeedMap
) {
  // We can open a read-only stream as nagios will never overwrite it's contents
  const stream = fs.createReadStream(nagios_status_path, 'utf-8');
  for await (const status of parse_nagios_status_file(stream)) {
    if (status === null) {
    } else if (status.type === 'ServiceStatus') {
      logger.debug({
        message: `Is Service(${status.status.service_description}@${status.status.host_name}) in the feed map?`,
        in_map: service_feed_map.has(
          service_map_feed_key_function(status.status)
        ),
      });
      // Evaluates all the feeds for the service
      for (const feed in service_feed_map.get(
        service_map_feed_key_function(status.status)
      )) {
        logger.debug({ message: 'Evaluating feed for: ', status: status });
      }
    }
  }
}
