import { NagiosFeed } from '../feeds/feed';
import Config from '../config/config';
import ServiceDeclaration from '../nagios/object_cache/service_cache';

// The key is a combination of the service description and hash name
// i.e. key = `${check_command}:${service_description}@${host_name}`
export type ServiceFeedMap = Map<string, { feeds: NagiosFeed[] }>;
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

// Interpolates the naming scheme, extracts all blocks of {{ ... }} with escapes
function interpolate_naming_schema(
  naming_scheme: string,
  named_groups: { [key: string]: string }
): string {
  const r = /((?<!\\){{.*?(?<!\\)}})/g;
  return naming_scheme.replace(r, (substring) => {
    let group_name = substring.slice(2, substring.length - 2);

    return named_groups[group_name] ?? ''; // TODO Error if no group exists
  });
}

// Figures out which feeds a service should expose
export function map_services_to_feeds(
  config: Config,
  services: ServiceDeclaration[]
): ServiceFeedMap {
  let feed_map: ServiceFeedMap = new Map();
  for (const service_exposure_block of config.exposures.services) {
    // For each service that matches, we define its feeds
    for (const service of services) {
      let service_matches = does_service_match(
        service,
        service_exposure_block.match
      );
      if (!service_matches.matches) continue;

      // Constructs the feeds
      let service_feeds: NagiosFeed[] = [];
      if (service_exposure_block.feeds.transparent !== undefined) {
        let feed = service_exposure_block.feeds.transparent;

        service_feeds.push({
          type: 'service:transparent',
          feed: {
            custom_data: {},
            dependencies: [],
            description: service.service_description,
            integration_id: `service::page_${feed.page.id}:space_${feed.space.id}:transparent::${service.check_command}:${service.service_description}@${service.host_name}`,
            name: interpolate_naming_schema(
              feed.naming_scheme,
              service_matches.named_groups
            ),
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
