// Interpolates a string, extracts all blocks of {{ ... }} with escapes
export function interpolate_string(
  str: string,
  interpolation_fields: { [key: string]: string }
): string {
  const r = /((?<!\\){{.*?(?<!\\)}})/g;
  return str.replace(r, (substring) => {
    let group_name = substring.slice(2, substring.length - 2);

    return interpolation_fields[group_name.trim()] ?? ''; // TODO Error if no group exists
  });
}
