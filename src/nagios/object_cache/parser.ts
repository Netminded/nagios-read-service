// Parses a nagios cache block
import { ReadStream } from 'fs';
import readline from 'readline';
import { logger } from '../../utils/logger';
import ServiceDeclaration, { service_schema } from './service_cache';

export type NagiosObjectDeclaration = {
  type: 'service';
  service: ServiceDeclaration;
};

export async function parse_block(
  rl: AsyncIterableIterator<string>
): Promise<{ [key: string]: string }> {
  let key_values: { [key: string]: string } = {};
  // Manually iterates through the line iterator
  let result = await rl.next();
  while (!result.done && result.value.trim() !== '}') {
    const line = result.value.trim();

    const key: string = line.substring(0, line.indexOf('\t'));
    key_values[key] = line.substring(line.indexOf('\t') + 1);

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
          await parse_block(iterator);
          break;
        case 'define service {':
          let service = await parse_block(iterator);
          const { error, value } = service_schema.validate(service);
          if (error === undefined) yield { type: 'service', service: value };
          else throw error;
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
  services: ServiceDeclaration[];
}

// A wrapper around `parse_object_cache` to collect all nagios objects into a simple data structure
export async function collect_nagios_objects(
  stream: ReadStream
): Promise<NagiosObjects> {
  let objects: NagiosObjects = { services: [] };
  for await (const cached_object of parse_object_cache(stream)) {
    if (cached_object === null) {
    } else if (cached_object.type === 'service') {
      objects.services.push(cached_object.service);
    }
  }
  return objects;
}