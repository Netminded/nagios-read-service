import Feed from '../feeds/feed';
import Config from '../config/config';
import ServiceDeclaration from '../nagios/object_cache/service_cache';
import { logger } from '../utils/logger';

export type ServiceFeedMap = Map<
  { host_name: string; service_description: string },
  { feeds: Feed[] }
>;

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
      let service_feeds: Feed[] = [];
      if (service_exposure_block.feeds.transparent !== undefined) {
        let feed = service_exposure_block.feeds.transparent;
        service_feeds.push({
          custom_data: {},
          dependencies: [],
          description: service.service_description,
          integration_id: '', // TODO Integration ID
          name: '', // TODO Naming scheme
          organisationId: 0, // TODO Organisation
          pageId: feed.page.id,
          spaceId: feed.space.id,
        });
      }
      // Sets up the feeds
      feed_map.set(
        {
          host_name: service.host_name,
          service_description: service.service_description,
        },
        {
          feeds: service_feeds,
        }
      );
      logger.debug({
        message: 'Feed map: ',
        feeds: feed_map,
      });
    }
  }
  return feed_map;
}
