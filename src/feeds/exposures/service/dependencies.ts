// Calculates the dependencies of all service feeds, and updates them in-place
import { NagiosObjects } from '../../../parsers/nagios/object_cache/parser';
import { ExposureMap } from '../exposures';

export function make_service_dependencies(
  objects: NagiosObjects,
  exposure_map: ExposureMap
) {
  // // Key is a UniqueServiceId
  // for (const [key, feeds] of exposure_map.service_map) {
  //   // Gets this iteration's service
  //   const service = objects.services.get(key);
  //   if (service === undefined) continue;
  //
  //   // Gets the service's associated host feeds
  //   const host_feeds = exposure_map.host_map.get(get_unique_host_id(service));
  //
  //   // The integration ids of the dependencies
  //   const dependencies: string[] = [];
  //   // If the host has any dependencies for the 'status' feed, each feed of this service also depends on them
  //   if (host_feeds?.status_feed !== undefined) {
  //     dependencies.push(...host_feeds.status_feed.dependencies);
  //     dependencies.push(host_feeds.status_feed.integration_id);
  //   }
  //
  //   // If the service has an 'Is Running?' feed, we include it as a dependency
  //   // Update the dependencies of each feed
  //   if (feeds.transparent !== undefined)
  //     feeds.transparent.dependencies = dependencies.concat(
  //       feeds.diagnostic.is_running === undefined
  //         ? []
  //         : feeds.diagnostic.is_running.integration_id
  //     );
  //   if (feeds.diagnostic.is_running !== undefined)
  //     feeds.diagnostic.is_running.dependencies = dependencies;
  //   if (feeds.plugin.ping !== undefined)
  //     feeds.plugin.ping.dependencies = dependencies.concat(
  //       feeds.diagnostic.is_running === undefined
  //         ? []
  //         : feeds.diagnostic.is_running.integration_id
  //     );
  // }
}
