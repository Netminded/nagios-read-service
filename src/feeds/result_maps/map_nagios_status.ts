// Maps a nagios status to a bunch of feed results, each result is yielded for
// a calling function to handle
import { NagiosStatus } from '../../parsers/nagios/status/parser';
import { ExposureMap } from '../exposures/exposures';
import Feed from '../feed';
import FeedResult from './feed_result';
import { get_unique_service_id } from '../../parsers/nagios/object_cache/service_cache';
import map_service_to_transparent_feed from './service_status/transparent';
import map_service_to_diagnostic_is_running_feed from './service_status/diagnostic/is_running';
import { get_unique_host_id } from '../../parsers/nagios/object_cache/host_cache';
import { map_host_to_status_feed } from './host_status/status';

export function* map_nagios_status_to_feed(
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
