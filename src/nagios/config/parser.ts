// As of now, these are the only properties of the config that we care aboout
import { ReadStream } from 'fs';
import readline from 'readline';

export interface NagiosConfig {
  object_cache_file: string;
  status_file: string;
}

// Parses the nagios config file for the relevant information
export default async function parse_nagios_config_file(
  config_file: ReadStream
): Promise<NagiosConfig> {
  const nagios_config = {
    object_cache_file: '',
    status_file: '',
  };
  // Parses the file
  const rl = readline.createInterface(config_file);
  for await (const l of rl) {
    const line = l.trim();
    // The only two cases we care about
    if (line.startsWith('object_cache_file=')) {
      nagios_config.object_cache_file = line.split('object_cache_file=')[1];
    } else if (line.startsWith('status_file=')) {
      nagios_config.status_file = line.split('status_file=')[1];
    }
  }
  // Validates the response
  if (nagios_config.status_file === '') {
    throw new Error('Invalid nagios config file; missing `status_file`');
  } else if (nagios_config.object_cache_file === '') {
    throw new Error('Invalid nagios config file; missing `object_cache_file`');
  } else {
    return nagios_config;
  }
}
