// Polls nagios for the latest status information
import { service_map_feed_key_function } from '../exposures/service';
import fs from 'fs';
import { NagiosStatus, parse_nagios_status_file } from './status/parser';
import FeedResult from '../feeds/feed_result';
import map_service_to_transparent_feed from '../feeds/service_status/transparent';
import Feed from '../feeds/feed';
import { ExposureMap } from '../exposures/exposures';
import { host_map_feed_key_function } from '../exposures/host';
import { map_host_to_status_feed } from '../feeds/host_status/status';

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
        );
        if (feeds === undefined) return;

        // Evaluates the feeds for the service
        // Yields the results, if they are null (likely due to soft state), we ignore the result
        if (feeds.transparent !== undefined) {
          const result = map_service_to_transparent_feed(service);
          if (result !== null) yield [feeds.transparent, result];
        }
        if (feeds.diagnostic.is_running !== undefined) {
          // TODO, Define status -> feed result map
        }
        if (feeds.plugin.ping !== undefined) {
          const result = map_service_to_transparent_feed(service);
          if (result !== null) yield [feeds.plugin.ping, result];
        }
      }
      break;
    case 'HostStatus':
      {
        const host = status.status;
        // Gets the feeds exposed by the host
        const feeds = feed_map.host_map.get(host_map_feed_key_function(host));
        if (feeds === undefined) return;

        // Evaluates the feeds for the host
        if (feeds.status_feed !== undefined) {
          const result = map_host_to_status_feed(host);
          if (result !== null) yield [feeds.status_feed, result];
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
