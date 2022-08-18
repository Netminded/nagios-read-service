// Checks if a service matches a Service Match block
import ServiceDeclaration from '../../../parsers/nagios/object_cache/service_cache';

export function does_service_match(
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
