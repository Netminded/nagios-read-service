// Interpolates a string,
// Replaces all blocks of {{ <name> }} with interpolation_fields[name],
export function interpolate_string(
  str: string,
  interpolation_fields: { [key: string]: string }
): string {
  // Field interpolation
  const field_regex = /(?<!\\)({{\s*\w+\s*}})/g;
  return str.replace(field_regex, (substring) => {
    const group_name = substring.slice(2, substring.length - 2);

    return interpolation_fields[group_name.trim()] ?? ''; // TODO Error if no group exists
  });
}

// Interpolates a string,
// Replaces all blocks of {! <ENV_VAR> !} with the environment variable of the same name
export function interpolate_env_string(str: string): string {
  // Env interpolation
  const env_regex = /(?<!\\)({!\s*\w+\s*!})/g;
  return str.replace(env_regex, (substring) => {
    const env_name = substring.slice(2, substring.length - 2);

    return process.env[env_name.trim()] || ''; // TODO Error if no env var exists
  });
}
