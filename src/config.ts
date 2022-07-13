import * as toml from 'toml';

export default interface Config {
  nagios_config_file_path: string;
  check_interval: number;
}

export function parser_config_file(config_string: string): Config {
  const data = toml.parse(config_string);
  return data as Config;
  // return {
  //   nagios_config_file_path: '',
  //   check_interval: 0,
  // };
}
