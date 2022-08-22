// Extracts the tags from the a nagios object's custom_variables section,
// a tag is a custom variable that begins with _NMTAG_,
// everything after the _NMTAG_ is the tag name
export function extract_tags_from_custom_variables(
  custom_variables: Record<string, string | string[]>
): string[] {
  // Checks if we have an _NMTAG custom variable
  if (custom_variables['_NMTAG'] === undefined) return [];
  else {
    // Is the custom variable an array?
    if (Array.isArray(custom_variables['_NMTAG']))
      return custom_variables['_NMTAG'];
    else return [custom_variables['_NMTAG']];
  }
}
