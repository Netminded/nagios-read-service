import { ReadStream } from 'fs';
import * as readline from 'readline';

import NagiosStatusInfo, { parse_info_block } from './info_block';
import NagiosProgramStatus from './nagios_status_block';
import HostStatus, { parse_host_status } from './host_status_block';
import ServiceStatus, { parse_service_status } from './service_status_block';

import { logger } from '../../utils/logger';

export type NagiosStatus =
  | { type: 'Info'; status: NagiosStatusInfo }
  | { type: 'ProgramStatus'; status: NagiosProgramStatus }
  | { type: 'HostStatus'; status: HostStatus }
  | { type: 'ServiceStatus'; status: ServiceStatus };

// Consumes lines until the end of the nagios status block
export async function do_nothing_parser(
  rl: AsyncIterableIterator<string>
): Promise<null> {
  // Manually iterates through the line iterator
  let result = await rl.next();
  while (!result.done) {
    const line = result.value.trim();
    // The block has finished being parsed
    if (line === '}') {
      return null;
    }
    result = await rl.next();
  }
  return null;
}

// Will produce an iterator (via a generator) over a nagios status.dat file stream
// which converts the status.dat file into usable status objects.
//
// Nagios will never write to the file after it has been created, the process
// that nagios uses is:
//    (1) Create a temporary file
//    (2) Write the status to the temporary file
//    (3) Move the temporary file to the status.dat file
//        (i.e. The path pointing to status.dat now points instead at this
//        temporary file; which is no longer temporary)
//
// This means that the old status.dat file, once opened for reading, will remain
// open (and unchanged) for the duration that this code needs it for. It is just
// that the file cannot easily be opened by another process as it no longer
// has a path pointing to it.
//
// Which means that we can continue using a file stream over the file, as nagios
// will not change the file's contents while we're reading it
export async function* parse_nagios_status_file(
  status_file: ReadStream
): AsyncGenerator<NagiosStatus | null> {
  const rl = readline.createInterface(status_file);
  const iterator = rl[Symbol.asyncIterator]();
  // Parses the file
  for await (const line of iterator) {
    // The status.dat file starts with a disclaimer section, all of which starts with '#'
    if (!line.startsWith('#')) {
      switch (line.trim()) {
        case 'info {':
          yield { type: 'Info', status: await parse_info_block(iterator) };
          break;
        case 'programstatus {':
          await do_nothing_parser(iterator);
          yield null;
          break;
        case 'hoststatus {':
          yield {
            type: 'HostStatus',
            status: await parse_host_status(iterator),
          };
          break;
        case 'servicestatus {':
          yield {
            type: 'ServiceStatus',
            status: await parse_service_status(iterator),
          };
          break;
        case 'contactstatus {':
          await do_nothing_parser(iterator);
          yield null;
          break;
        case 'hostcomment {':
          await do_nothing_parser(iterator);
          yield null;
          break;
        case 'servicecomment {':
          await do_nothing_parser(iterator);
          yield null;
          break;
        case 'hostdowntime {':
          await do_nothing_parser(iterator);
          yield null;
          break;
        case 'servicedowntime {':
          await do_nothing_parser(iterator);
          yield null;
          break;
        case '':
          break;
        default:
          logger.warn({
            message:
              'Received unexpected line in `status.dat` file; ignoring it and continuing on as normal',
            line: line,
          });
          break;
      }
    }
  }
}
