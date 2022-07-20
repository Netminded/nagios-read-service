// Maps a host to it's feed exposures, keyed by  host_map_feed_key_function
import Feed from '../feeds/feed';
import Config from '../config/config';
import { HostDeclaration } from '../nagios/object_cache/host_cache';
import { interpolate_string } from '../utils/interpolation';

export type HostExposures = Map<
  string,
  {
    status_feed?: Feed;
  }
>;
export function host_map_feed_key_function(host: {
  host_name: string;
  check_command?: string;
}): string {
  return `${host.check_command || 'none'}:${host.host_name}`;
}

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
  hosts: HostDeclaration[]
): HostExposures {
  const feed_map: HostExposures = new Map();
  for (const host_exposure of config.exposures.hosts ?? []) {
    for (const host of hosts) {
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
      let host_feeds = {
        status_feed: <Feed | undefined>undefined,
      };
      if (host_exposure.feeds.status !== undefined) {
        const feed = host_exposure.feeds.status;

        host_feeds.status_feed = {
          custom_data: {},
          api_key_name: feed.api_key,
          dependencies: [],
          description: interpolate_string(
            feed.description,
            interpolation_fields
          ),
          integration_id: `host::page_${feed.page.id}:space_${feed.space.id}:status::${host.check_command}:${host.host_name}`,
          name: interpolate_string(feed.name, interpolation_fields),
          organisationId: feed.organisation.id,
          pageId: feed.page.id,
          spaceId: feed.space.id,
        };
      }
      feed_map.set(host_map_feed_key_function(host), host_feeds);
    }
  }
  return feed_map;
}
