// Parses a nagios cache block
import { ReadStream } from 'fs';
import readline from 'readline';
import { logger } from '../../../utils/logger';
import ServiceDeclaration, {
  get_unique_service_id,
  service_schema,
  UniqueServiceId,
} from './service_cache';
import {
  get_unique_host_id,
  host_schema,
  HostDeclaration,
  UniqueHostId,
} from './host_cache';

export type NagiosObjectDeclaration =
  | {
      type: 'service';
      service: ServiceDeclaration;
    }
  | {
      type: 'host';
      host: HostDeclaration;
    };

// Parses each key value pair found in a nagios block,
// if the same key is found multiple times (e.g. _NMTAG), then the value
// associated will be a list containing all values found in the blocks
export async function parse_block(
  rl: AsyncIterableIterator<string>
): Promise<{ [key: string]: string | string[] }> {
  const key_values: { [key: string]: string | string[] } = {};
  // Manually iterates through the line iterator
  let result = await rl.next();
  while (!result.done && result.value.trim() !== '}') {
    const line = result.value.trim();

    const key: string = line.substring(0, line.indexOf('\t'));
    const value: string = line.substring(line.indexOf('\t') + 1);

    // If the key is already in the map, then we convert the entry to a list
    // and append to it
    if (key_values.hasOwnProperty(key)) {
      if (Array.isArray(key_values[key]))
        key_values[key] = [...key_values[key], value];
      else {
        // @ts-ignore -- We know that key_values[key] is a string due to the above check
        key_values[key] = [key_values[key], value];
      }
    }
    // Otherwise, we just assign the value to the key
    else {
      key_values[key] = value;
    }

    result = await rl.next();
  }
  return key_values;
}

export async function* parse_object_cache(
  status_file: ReadStream
): AsyncGenerator<NagiosObjectDeclaration> {
  const rl = readline.createInterface(status_file);
  const iterator = rl[Symbol.asyncIterator]();
  // Parses the file
  for await (const line of iterator) {
    // The status.dat file starts with a disclaimer section, all of which starts with '#'
    if (!line.startsWith('#')) {
      switch (line.trim()) {
        case 'define timeperiod {':
          await parse_block(iterator);
          break;
        case 'define command {':
          await parse_block(iterator);
          break;
        case 'define contactgroup {':
          await parse_block(iterator);
          break;
        case 'define hostgroup {':
          await parse_block(iterator);
          break;
        case 'define servicegroup {':
          await parse_block(iterator);
          break;
        case 'define contact {':
          await parse_block(iterator);
          break;
        case 'define host {':
          {
            const host = await parse_block(iterator);
            const { error, value } = host_schema.validate(host);
            if (error === undefined) yield { type: 'host', host: value };
            else throw error;
          }
          break;
        case 'define service {':
          {
            const service = await parse_block(iterator);
            const { error, value } = service_schema.validate(service);
            if (error === undefined) yield { type: 'service', service: value };
            else throw error;
          }
          break;
        case 'define servicedependency {':
          await parse_block(iterator);
          break;
        case 'define serviceescalation {':
          await parse_block(iterator);
          break;
        case 'define hostdependency {':
          await parse_block(iterator);
          break;
        case 'define hostescalation {':
          await parse_block(iterator);
          break;
        case '':
          break;
        default:
          logger.warn({
            message:
              'Received unexpected line in `object.cache` file; ignoring it and continuing on as normal',
            line: line,
          });
          break;
      }
    }
  }
}

export interface NagiosObjects {
  services: Map<UniqueServiceId, ServiceDeclaration>;
  hosts: Map<UniqueHostId, HostDeclaration>;
}

// A wrapper around `parse_object_cache` to collect all nagios objects into a simple data structure
export async function collect_nagios_objects(
  stream: ReadStream
): Promise<NagiosObjects> {
  const objects: NagiosObjects = { services: new Map(), hosts: new Map() };
  for await (const cached_object of parse_object_cache(stream)) {
    if (cached_object !== null) {
      switch (cached_object.type) {
        case 'service':
          objects.services.set(
            get_unique_service_id(cached_object.service),
            cached_object.service
          );
          break;
        case 'host':
          objects.hosts.set(
            get_unique_host_id(cached_object.host),
            cached_object.host
          );
      }
    }
  }
  return objects;
}
