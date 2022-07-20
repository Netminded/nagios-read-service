import {
  make_service_dependencies,
  map_services_to_feeds,
  ServiceExposures,
} from './service';
import {
  HostExposures,
  make_host_dependencies,
  map_host_to_feeds,
} from './host';
import Config from '../config/config';
import { logger } from '../utils/logger';
import { NagiosObjects } from '../nagios/object_cache/parser';

export type ExposureMap = {
  service_map: ServiceExposures;
  host_map: HostExposures;
};

// Calculates an exposure map for the nagios objects, any objects that fall
// under an exposure block will be mapped to a feed
export function map_exposures(
  config: Config,
  nagios_objects: NagiosObjects
): ExposureMap {
  // Calculates the mapping of service to feeds
  const service_feed_map = map_services_to_feeds(
    config,
    nagios_objects.services
  );
  logger.info(
    `Mapped services to feeds; found ${service_feed_map.size} mappings`
  );
  // Calculates the mapping of hosts to feeds
  const host_feed_map = map_host_to_feeds(config, nagios_objects.hosts);
  logger.info(`Mapped hosts to feeds; found ${host_feed_map.size} mappings`);

  // Not really constant, the dependency calculation updates in place
  const exposure_map: ExposureMap = {
    service_map: service_feed_map,
    host_map: host_feed_map,
  };

  // Calculates the dependencies of all feeds (that have been exposed)
  make_host_dependencies(exposure_map);
  make_service_dependencies(nagios_objects, exposure_map);

  return exposure_map;
}
