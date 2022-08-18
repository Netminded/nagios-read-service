// Checks if the host matches with the match conditions
import { HostDeclaration } from '../../../parsers/nagios/object_cache/host_cache';

export function does_host_match(
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
