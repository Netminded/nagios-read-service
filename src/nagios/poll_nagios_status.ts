// Polls nagios for the latest status information
import { service_map_feed_key_function } from '../exposures/service';
import fs from 'fs';
import { NagiosStatus, parse_nagios_status_file } from './status/parser';
import FeedResult from '../feeds/feed_result';
import map_service_to_transparent_feed from '../feeds/service_status/transparent';
import Feed from '../feeds/feed';
import { ExposureMap } from '../exposures/exposures';
import map_service_to_plugin_ping_feed from '../feeds/service_status/plugins/ping';

// Maps a nagios status to a bunch of feed results, each result is yielded for
// a calling function to handle
export function* map_nagios_status_to_feed(
  status: NagiosStatus,
  feed_map: ExposureMap
): Generator<[Feed, FeedResult]> {
  switch (status.type) {
    case 'ServiceStatus':
      {
        const service = status.status;
        // Gets the feeds exposed by the service
        const feeds = feed_map.service_map.get(
          service_map_feed_key_function(service)
        ) ?? { feeds: [] };

        // Evaluates the feeds for the service
        for (const feed of feeds.feeds) {
          let result: FeedResult | null = null;
          // Uses the corresponding feed function
          switch (feed.type) {
            case 'service:transparent':
              result = map_service_to_transparent_feed(status.status);
              break;
            case 'service:diagnostic:is_running':
              // TODO, Define status -> feed result map
              break;
            case 'service:plugin:ping':
              result = map_service_to_plugin_ping_feed(status.status);
              break;
          }
          // Yields the result, if it is null (likely due to soft state), we ignore the result
          if (result !== null) yield [feed.feed, result];
        }
      }
      break;
  }
}

// A generator which yields feeds and their corresponding results for all
// status' in the nagios status file
export async function* poll_nagios_status(
  nagios_status_path: string,
  exposure_map: ExposureMap
): AsyncGenerator<[Feed, FeedResult]> {
  // We can open a read-only stream as nagios will never overwrite it's contents
  const stream = fs.createReadStream(nagios_status_path, 'utf-8');

  for await (const status of parse_nagios_status_file(stream)) {
    if (status !== null) yield* map_nagios_status_to_feed(status, exposure_map);
  }
}
