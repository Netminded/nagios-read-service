import Feed from '../../feed';
import Config from '../../../parsers/service/config';
import ServiceDeclaration, {
  get_unique_service_id,
  UniqueServiceId,
} from '../../../parsers/nagios/object_cache/service_cache';
import {
  interpolate_string,
  unescape_curly_braces,
} from '../../../utils/interpolation';
import { extract_tags_from_custom_variables } from '../../../utils/tags';
import { does_service_match } from './match';

// The feeds that a service can have,
// the same feed type can be defined multiple times, as long as they're for
// different space, page, and organisations.
type ServiceFeeds = (
  | {
      type: 'transparent';
      feed: Feed;
    }
  | {
      type: 'diagnostic::is_running';
      feed: Feed;
    }
  | {
      type: 'plugin::ping';
      feed: Feed;
    }
)[];

// The mapping between services and their feeds
export type ServiceExposures = Map<UniqueServiceId, ServiceFeeds>;

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
      const generated_feeds: ServiceFeeds = [];

      // If the is transparent feed has been defined in the exposure definition
      if (service_exposure_block.feeds.transparent !== undefined) {
        const feed = service_exposure_block.feeds.transparent;

        generated_feeds.push({
          type: 'transparent',
          feed: {
            custom_data: {
              ...extract_tags_from_custom_variables(service.custom_variables),
              ...feed.tags,
            }, // Tags defined in feed declaration take priority
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
          },
        });
      }
      // If the is running diagnostic feed has been defined in the exposure definition
      if (service_exposure_block.feeds.diagnostic?.is_running !== undefined) {
        const feed = service_exposure_block.feeds.diagnostic.is_running;

        generated_feeds.push({
          type: 'diagnostic::is_running',
          feed: {
            custom_data: {
              ...extract_tags_from_custom_variables(service.custom_variables),
              ...feed.tags,
            }, // Tags defined in feed declaration take priority
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
          },
        });
      }
      // If the is ping plugin feed has been defined in the exposure definition
      if (service_exposure_block.feeds.plugin?.ping !== undefined) {
        const feed = service_exposure_block.feeds.plugin.ping;

        generated_feeds.push({
          type: 'plugin::ping',
          feed: {
            custom_data: {
              ...extract_tags_from_custom_variables(service.custom_variables),
              ...feed.tags,
            }, // Tags defined in feed declaration take priority
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
          },
        });
      }

      // The service may already have feeds from another host exposure block
      const unique_service_id = get_unique_service_id(service);
      const existing_feeds = feed_map.get(unique_service_id);
      if (existing_feeds === undefined) {
        feed_map.set(unique_service_id, generated_feeds);
      } else {
        // Check if we've redefined an existing feed
        const new_integration_ids = new Set(
          generated_feeds.map((feed) => feed.feed.integration_id)
        );
        for (const existing of existing_feeds)
          if (new_integration_ids.has(existing.feed.integration_id))
            throw Error(
              `Duplicate service feed defined, integration id is '${existing.feed.integration_id}'`
            );
        // If we're here, add the new feeds to the existing feeds
        feed_map.set(unique_service_id, [
          ...existing_feeds,
          ...generated_feeds,
        ]);
      }
    }
  }
  return feed_map;
}
