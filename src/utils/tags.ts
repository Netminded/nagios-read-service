// Extracts the tags from the a nagios object's custom_variables section,
// a tag is a custom variable that begins with _NMTAG_,
// everything after the _NMTAG_ is the tag name
export function extract_tags_from_custom_variables(
  custom_variables: Record<string, string>
): Record<string, string> {
  const tags: Record<string, string> = {};
  Object.entries(custom_variables)
    .filter(([tag, _]) => {
      return tag.startsWith('_NMTAG_');
    })
    .map(([tag, value]) => {
      return [tag.substring(7), value]; // Excludes '_NMTAG_'
    })
    .forEach(([tag, value]) => {
      tags[tag] = value;
    });
  return tags;
}
