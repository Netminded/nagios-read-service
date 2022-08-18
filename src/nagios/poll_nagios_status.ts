// Polls nagios for the latest status information
import fs from 'fs';
import { NagiosStatus, parse_nagios_status_file } from './status/parser';
import FeedResult from '../feeds/feed_result';
import map_service_to_transparent_feed from '../feeds/service_status/transparent';
import Feed from '../feeds/feed';
import { ExposureMap } from '../exposures/exposures';
import { map_host_to_status_feed } from '../feeds/host_status/status';
import { get_unique_service_id } from './object_cache/service_cache';
import { get_unique_host_id } from './object_cache/host_cache';
import map_service_to_diagnostic_is_running_feed from '../feeds/service_status/diagnostic/is_running';

// Maps a nagios status to a bunch of feed results, each result is yielded for
// a calling function to handle
function* map_nagios_status_to_feed(
  status: NagiosStatus,
  feed_map: ExposureMap
): Generator<[Feed, FeedResult]> {
  switch (status.type) {
    case 'ServiceStatus':
      {
        const service = status.status;
        // Gets the feeds exposed by the service
        const feeds = feed_map.service_map.get(get_unique_service_id(service));
        if (feeds === undefined) return;

        // Evaluates the feeds for the service
        // Yields the results, if they are null (likely due to soft state), we ignore the result
        for (const feed of feeds) {
          let result = null;
          switch (feed.type) {
            case 'transparent':
              result = map_service_to_transparent_feed(service);
              break;
            case 'diagnostic::is_running':
              result = map_service_to_diagnostic_is_running_feed(service);
              break;
            case 'plugin::ping':
              result = map_service_to_transparent_feed(service);
              break;
          }
          // Upsert
          if (result !== null) yield [feed.feed, result];
        }
      }
      break;
    case 'HostStatus':
      {
        const host = status.status;
        // Gets the feeds exposed by the host
        const feeds = feed_map.host_map.get(get_unique_host_id(host));
        if (feeds === undefined) return;

        // Evaluates the feeds for the host
        for (const feed of feeds) {
          let result = null;
          switch (feed.type) {
            case 'status':
              result = map_host_to_status_feed(host);
              break;
          }
          // Upsert
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
