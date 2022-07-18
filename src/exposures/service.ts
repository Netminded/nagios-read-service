import { NagiosFeed } from '../feeds/feed';
import Config from '../config/config';
import ServiceDeclaration from '../nagios/object_cache/service_cache';
import { interpolate_string } from '../utils/interpolation';

// The key is a combination of the service description and hash name
// i.e. key = `${check_command}:${service_description}@${host_name}`
export type ServiceExposureMap = Map<string, { feeds: NagiosFeed[] }>;
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
    service_description?: RegExp;
    command?: RegExp;
  }
):
  | { matches: false }
  | { matches: true; named_groups: { [key: string]: string } } {
  // Early exit, as there are no conditions, the service does not match
  if (match.service_description === undefined && match.command === undefined)
    return { matches: false };

  // Matches against the service
  let desc_groups = match.service_description?.exec(
    service.service_description
  );
  let cmd_groups = match.command?.exec(service.check_command);

  // If there was no match, exit
  if (
    (desc_groups === null || desc_groups === undefined) &&
    (cmd_groups === null || cmd_groups === undefined)
  )
    return { matches: false };

  return {
    matches: true,
    named_groups: { ...desc_groups?.groups, ...cmd_groups?.groups },
  };
}

// Figures out which feeds a service should expose
export function map_services_to_feeds(
  config: Config,
  services: ServiceDeclaration[]
): ServiceExposureMap {
  let feed_map: ServiceExposureMap = new Map();
  for (const service_exposure_block of config.exposures.services) {
    // For each service that matches, we define its feeds
    for (const service of services) {
      let service_matches = does_service_match(
        service,
        service_exposure_block.match
      );
      if (!service_matches.matches) continue;
      // The fields that string interpolation can use
      let interpolation_fields = {
        // Default fields
        host_name: service.host_name,
        service_description: service.service_description,
        check_command: service.check_command,
        display_name: service.display_name,
        // Fields captured by the regex
        ...service_matches.named_groups,
      };

      // Constructs the feeds
      let service_feeds: NagiosFeed[] = [];
      if (service_exposure_block.feeds.transparent !== undefined) {
        let feed = service_exposure_block.feeds.transparent;

        service_feeds.push({
          type: 'service:transparent',
          feed: {
            custom_data: {},
            dependencies: [],
            description: interpolate_string(
              feed.description,
              interpolation_fields
            ),
            integration_id: `service::page_${feed.page.id}:space_${feed.space.id}:transparent::${service.check_command}:${service.service_description}@${service.host_name}`,
            name: interpolate_string(feed.name, interpolation_fields),
            organisationId: 0, // TODO Organisation
            pageId: feed.page.id,
            spaceId: feed.space.id,
          },
        });
      }
      if (service_exposure_block.feeds.diagnostic?.is_running !== undefined) {
        let feed = service_exposure_block.feeds.diagnostic.is_running;

        service_feeds.push({
          type: 'service:diagnostic:is_running',
          feed: {
            custom_data: {},
            dependencies: [],
            description: interpolate_string(
              feed.description,
              interpolation_fields
            ),
            integration_id: `service::page_${feed.page.id}:space_${feed.space.id}:diagnostic:is_running::${service.check_command}:${service.service_description}@${service.host_name}`,
            name: interpolate_string(feed.name, interpolation_fields),
            organisationId: 0, // TODO Organisation
            pageId: feed.page.id,
            spaceId: feed.space.id,
          },
        });
      }
      if (service_exposure_block.feeds.plugin?.ping !== undefined) {
        let feed = service_exposure_block.feeds.plugin.ping;

        service_feeds.push({
          type: 'service:plugin:ping',
          feed: {
            custom_data: {},
            dependencies: [],
            description: interpolate_string(
              feed.description,
              interpolation_fields
            ),
            integration_id: `service::page_${feed.page.id}:space_${feed.space.id}:plugin_ping::${service.check_command}:${service.service_description}@${service.host_name}`,
            name: interpolate_string(feed.name, interpolation_fields),
            organisationId: 0, // TODO Organisation
            pageId: feed.page.id,
            spaceId: feed.space.id,
          },
        });
      }
      // Sets up the feeds
      feed_map.set(service_map_feed_key_function(service), {
        feeds: service_feeds,
      });
    }
  }
  return feed_map;
}
