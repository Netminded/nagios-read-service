// Maps a host to it's feed exposures, keyed by  host_map_feed_key_function
import Feed from '../feeds/feed';
import Config from '../config/config';
import {
  get_unique_host_id,
  HostDeclaration,
  UniqueHostId,
} from '../nagios/object_cache/host_cache';
import {
  interpolate_string,
  unescape_curly_braces,
} from '../utils/interpolation';
import { ExposureMap } from './exposures';
import { extract_tags_from_custom_variables } from '../utils/tags';

// The set of feeds that a host can have
type HostFeeds = {
  type: 'status';
  feed: Feed;
}[];

// The mapping between a host and its feeds,
// a single host may have multiple of the same feed
export type HostExposures = Map<UniqueHostId, HostFeeds>;

// Checks if the host matches with the match conditions
function does_host_match(
  host: HostDeclaration,
  match: {
    host_name?: RegExp;
    address?: RegExp;
    check_command?: RegExp;
  }
):
  | { matches: false }
  | { matches: true; named_groups: { [key: string]: string } } {
  // Early exit, as there are no conditions, the service does not match
  if (
    match.host_name === undefined &&
    match.address === undefined &&
    match.check_command === undefined
  )
    return { matches: false };

  // Matches against the service
  const host_groups = match.host_name?.exec(host.host_name);
  const addr_groups =
    host.address === undefined ? undefined : match.address?.exec(host.address);
  const cmd_groups =
    host.check_command === undefined
      ? undefined
      : match.check_command?.exec(host.check_command);

  // If there was no match, exit
  if (
    (host_groups === null || host_groups === undefined) &&
    (addr_groups === null || addr_groups === undefined) &&
    (cmd_groups === null || cmd_groups === undefined)
  )
    return { matches: false };

  return {
    matches: true,
    named_groups: {
      ...host_groups?.groups,
      ...addr_groups?.groups,
      ...cmd_groups?.groups,
    },
  };
}

// Maps nagios hosts to the feeds that they have been defined to expose
export function map_host_to_feeds(
  config: Config,
  hosts: Map<UniqueHostId, HostDeclaration>
): HostExposures {
  const feed_map: HostExposures = new Map();
  for (const host_exposure of config.exposures.hosts ?? []) {
    for (const [_, host] of hosts) {
      // Checks to see if the host is in the match block of the exposure
      const host_matches = does_host_match(host, host_exposure.match);
      if (!host_matches.matches) continue;

      // The fields that string interpolation can use
      const interpolation_fields: Record<string, string> = {
        // Default fields
        host_name: host.host_name,
        display_name: host.display_name,
        // Fields captured by the regex
        ...host_matches.named_groups,
      };
      if (host.address !== undefined)
        interpolation_fields.address = host.address;
      if (host.check_command !== undefined)
        interpolation_fields.check_command = host.check_command;

      // Maps feeds
      const host_feeds: HostFeeds = [];
      if (host_exposure.feeds.status !== undefined) {
        const feed = host_exposure.feeds.status;

        host_feeds.push({
          type: 'status',
          feed: {
            custom_data: {
              ...extract_tags_from_custom_variables(host.custom_variables),
              ...feed.tags,
            }, // Tags defined in feed declaration take priority
            api_key_name: feed.api_key,
            dependencies: [], // We complete dependencies at a later stage, once we know about all feeds that exist
            description: unescape_curly_braces(
              interpolate_string(feed.description, interpolation_fields)
            ),
            integration_id: `host::page_${feed.page.id}:space_${feed.space.id}:status::${host.host_name}`,
            name: unescape_curly_braces(
              interpolate_string(feed.name, interpolation_fields)
            ),
            organisationId: feed.organisation.id,
            pageId: feed.page.id,
            spaceId: feed.space.id,
          },
        });
      }
      // The host may already have feeds from another host exposure block
      const unique_host_id = get_unique_host_id(host);
      const existing_feeds = feed_map.get(unique_host_id);
      if (existing_feeds === undefined) {
        feed_map.set(unique_host_id, host_feeds);
      } else {
        // Check if we've redefined an existing feed
        const new_integration_ids = new Set(
          host_feeds.map((feed) => feed.feed.integration_id)
        );
        for (const existing of existing_feeds)
          if (new_integration_ids.has(existing.feed.integration_id))
            throw Error(
              `Duplicate host feed defined, integration id is '${existing.feed.integration_id}'`
            );
        // If we're here, add the new feeds to the existing feeds
        feed_map.set(unique_host_id, [...existing_feeds, ...host_feeds]);
      }
    }
  }
  return feed_map;
}

// Calculates the dependencies of all host feeds, and updates them in-place
export function make_host_dependencies(_: ExposureMap) {
  // As of now, hosts don't have dependencies, so skip
}
