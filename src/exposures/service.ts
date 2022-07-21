import Feed from '../feeds/feed';
import Config from '../config/config';
import ServiceDeclaration, {
  get_unique_service_id,
  UniqueServiceId,
} from '../nagios/object_cache/service_cache';
import {
  interpolate_string,
  unescape_curly_braces,
} from '../utils/interpolation';
import { ExposureMap } from './exposures';
import { get_unique_host_id } from '../nagios/object_cache/host_cache';
import { NagiosObjects } from '../nagios/object_cache/parser';

export type ServiceExposures = Map<
  UniqueServiceId,
  {
    transparent?: Feed;
    diagnostic: { is_running?: Feed };
    plugin: { ping?: Feed };
  }
>;

// Checks if a service matches a Service Match block
function does_service_match(
  service: ServiceDeclaration,
  match: {
    host_name?: RegExp;
    service_description?: RegExp;
    check_command?: RegExp;
  }
):
  | { matches: false }
  | { matches: true; named_groups: { [key: string]: string } } {
  // Early exit, as there are no conditions, the service does not match
  if (
    match.host_name === undefined &&
    match.service_description === undefined &&
    match.check_command === undefined
  )
    return { matches: false };

  // Matches against the service
  const host_groups = match.host_name?.exec(service.host_name);
  const desc_groups = match.service_description?.exec(
    service.service_description
  );
  const cmd_groups = match.check_command?.exec(service.check_command);

  // If there was no match, exit
  if (
    (host_groups === null || host_groups === undefined) &&
    (desc_groups === null || desc_groups === undefined) &&
    (cmd_groups === null || cmd_groups === undefined)
  )
    return { matches: false };

  return {
    matches: true,
    named_groups: {
      ...host_groups?.groups,
      ...desc_groups?.groups,
      ...cmd_groups?.groups,
    },
  };
}

// Figures out which feeds a service should expose
export function map_services_to_feeds(
  config: Config,
  services: Map<UniqueServiceId, ServiceDeclaration>
): ServiceExposures {
  const feed_map: ServiceExposures = new Map();
  for (const service_exposure_block of config.exposures.services ?? []) {
    // For each service that matches, we define its feeds
    for (const [_, service] of services) {
      const service_matches = does_service_match(
        service,
        service_exposure_block.match
      );
      if (!service_matches.matches) continue;
      // The fields that string interpolation can use
      const interpolation_fields = {
        // Default fields
        host_name: service.host_name,
        service_description: service.service_description,
        check_command: service.check_command,
        display_name: service.display_name,
        // Fields captured by the regex
        ...service_matches.named_groups,
      };

      // Constructs the feeds
      const service_feeds = {
        transparent: <Feed | undefined>undefined,
        diagnostic: { is_running: <Feed | undefined>undefined },
        plugin: { ping: <Feed | undefined>undefined },
      };

      if (service_exposure_block.feeds.transparent !== undefined) {
        const feed = service_exposure_block.feeds.transparent;

        service_feeds.transparent = {
          custom_data: {},
          api_key_name: feed.api_key,
          dependencies: [], // We complete dependencies at a later stage, once we know about all feeds that exist
          description: unescape_curly_braces(
            interpolate_string(feed.description, interpolation_fields)
          ),
          integration_id: `service::page_${feed.page.id}:space_${feed.space.id}:transparent::${service.service_description}@${service.host_name}`,
          name: unescape_curly_braces(
            interpolate_string(feed.name, interpolation_fields)
          ),
          organisationId: feed.organisation.id,
          pageId: feed.page.id,
          spaceId: feed.space.id,
        };
      }
      if (service_exposure_block.feeds.diagnostic?.is_running !== undefined) {
        const feed = service_exposure_block.feeds.diagnostic.is_running;

        service_feeds.diagnostic.is_running = {
          custom_data: {},
          api_key_name: feed.api_key,
          dependencies: [], // We complete dependencies at a later stage, once we know about all feeds that exist
          description: unescape_curly_braces(
            interpolate_string(feed.description, interpolation_fields)
          ),
          integration_id: `service::page_${feed.page.id}:space_${feed.space.id}:diagnostic:is_running::${service.service_description}@${service.host_name}`,
          name: unescape_curly_braces(
            interpolate_string(feed.name, interpolation_fields)
          ),
          organisationId: feed.organisation.id,
          pageId: feed.page.id,
          spaceId: feed.space.id,
        };
      }
      if (service_exposure_block.feeds.plugin?.ping !== undefined) {
        const feed = service_exposure_block.feeds.plugin.ping;

        service_feeds.plugin.ping = {
          custom_data: {},
          api_key_name: feed.api_key,
          dependencies: [], // We complete dependencies at a later stage, once we know about all feeds that exist
          description: unescape_curly_braces(
            interpolate_string(feed.description, interpolation_fields)
          ),
          integration_id: `service::page_${feed.page.id}:space_${feed.space.id}:plugin_ping::${service.service_description}@${service.host_name}`,
          name: unescape_curly_braces(
            interpolate_string(feed.name, interpolation_fields)
          ),
          organisationId: feed.organisation.id,
          pageId: feed.page.id,
          spaceId: feed.space.id,
        };
      }
      // Sets up the feeds
      feed_map.set(get_unique_service_id(service), service_feeds);
    }
  }
  return feed_map;
}

// Calculates the dependencies of all service feeds, and updates them in-place
export function make_service_dependencies(
  objects: NagiosObjects,
  exposure_map: ExposureMap
) {
  // Key is a UniqueServiceId
  for (const [key, feeds] of exposure_map.service_map) {
    // Gets this iteration's service
    const service = objects.services.get(key);
    if (service === undefined) continue;

    // Gets the service's associated host feeds
    const host_feeds = exposure_map.host_map.get(get_unique_host_id(service));

    // The integration ids of the dependencies
    const dependencies: string[] = [];
    // If the host has any dependencies for the 'status' feed, each feed of this service also depends on them
    if (host_feeds?.status_feed !== undefined) {
      dependencies.push(...host_feeds.status_feed.dependencies);
      dependencies.push(host_feeds.status_feed.integration_id);
    }

    // If the service has an 'Is Running?' feed, we include it as a dependency
    // Update the dependencies of each feed
    if (feeds.transparent !== undefined)
      feeds.transparent.dependencies = dependencies.concat(
        feeds.diagnostic.is_running === undefined
          ? []
          : feeds.diagnostic.is_running.integration_id
      );
    if (feeds.diagnostic.is_running !== undefined)
      feeds.diagnostic.is_running.dependencies = dependencies;
    if (feeds.plugin.ping !== undefined)
      feeds.plugin.ping.dependencies = dependencies.concat(
        feeds.diagnostic.is_running === undefined
          ? []
          : feeds.diagnostic.is_running.integration_id
      );
  }
}
