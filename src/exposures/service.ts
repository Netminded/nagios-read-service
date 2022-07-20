import Feed from '../feeds/feed';
import Config from '../config/config';
import ServiceDeclaration from '../nagios/object_cache/service_cache';
import { interpolate_string } from '../utils/interpolation';

// The key is a combination of the service description and hash name
// i.e. key = `${check_command}:${service_description}@${host_name}`
export type ServiceExposureMap = Map<
  string,
  {
    transparent?: Feed;
    diagnostic: { is_running?: Feed };
    plugin: { ping?: Feed };
  }
>;
export const service_map_feed_key_function = (service: {
  check_command: string;
  service_description: string;
  host_name: string;
}): string => {
  return `${service.check_command}:${service.service_description}@${service.host_name}`;
};

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
  services: ServiceDeclaration[]
): ServiceExposureMap {
  const feed_map: ServiceExposureMap = new Map();
  for (const service_exposure_block of config.exposures.services ?? []) {
    // For each service that matches, we define its feeds
    for (const service of services) {
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
      let service_feeds = {
        transparent: <Feed | undefined>undefined,
        diagnostic: { is_running: <Feed | undefined>undefined },
        plugin: { ping: <Feed | undefined>undefined },
      };

      if (service_exposure_block.feeds.transparent !== undefined) {
        const feed = service_exposure_block.feeds.transparent;

        service_feeds.transparent = {
          custom_data: {},
          api_key_name: feed.api_key,
          dependencies: [],
          description: interpolate_string(
            feed.description,
            interpolation_fields
          ),
          integration_id: `service::page_${feed.page.id}:space_${feed.space.id}:transparent::${service.check_command}:${service.service_description}@${service.host_name}`,
          name: interpolate_string(feed.name, interpolation_fields),
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
          dependencies: [],
          description: interpolate_string(
            feed.description,
            interpolation_fields
          ),
          integration_id: `service::page_${feed.page.id}:space_${feed.space.id}:diagnostic:is_running::${service.check_command}:${service.service_description}@${service.host_name}`,
          name: interpolate_string(feed.name, interpolation_fields),
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
          dependencies: [],
          description: interpolate_string(
            feed.description,
            interpolation_fields
          ),
          integration_id: `service::page_${feed.page.id}:space_${feed.space.id}:plugin_ping::${service.check_command}:${service.service_description}@${service.host_name}`,
          name: interpolate_string(feed.name, interpolation_fields),
          organisationId: feed.organisation.id,
          pageId: feed.page.id,
          spaceId: feed.space.id,
        };
      }
      // Sets up the feeds
      feed_map.set(service_map_feed_key_function(service), service_feeds);
    }
  }
  return feed_map;
}
