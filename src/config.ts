import * as toml from 'toml';

// Example
// {
//     nagios_config_file_path: '',
//     check_interval: 0,
//     exposures: {
//       services: [
//         {
//           match: {
//             service_description: new RegExp('(?<service_description>.*)'),
//           },
//           feeds: {
//             diagnostic: {
//               is_running: {
//                 page: { id: 9 },
//                 space: { id: 10 },
//                 naming_scheme: 'Diagnostic Feed for ${service_description}',
//               },
//             },
//           },
//         },
//       ],
//       hosts: [],
//     },
//   };
export default interface Config {
  nagios_config_file_path: string;
  check_interval: number;
  // Defines how services are mapped to feeds
  // i.e. 'Feed Exposure' definitions
  exposures: {
    services: {
      // Which services does this feed exposure block apply to?
      // The match conditions are intersecting (i.e. AND)
      // If no match is provided, then it is assumed that this applies to no services
      match: {
        service_description?: RegExp | null;
        command?: RegExp | null;
      };
      // The feeds that all the services of this block expose
      feeds: {
        // Do these services expose a 'transparent' feed?
        transparent?: {
          page: { id: number };
          space: { id: number };
          // The naming scheme of the transparent feed for these services
          naming_scheme: any; // TODO
        };
        diagnostic?: {
          // Do these services expose a 'is_running' diagnostic feed?
          is_running?: {
            page: { id: number };
            space: { id: number };
            // The naming scheme of the is_running diagnostic feed for these services
            naming_scheme: any; // TODO
          };
        };
        plugin?: {
          // Do these services expose a 'ping' plugin feed?
          ping?: {
            page: { id: number };
            space: { id: number };
            // The naming scheme of the ping plugin feed for these services
            naming_scheme: any; // TODO
          };
        };
      };
    }[];
    //
    hosts: {}[];
  };
}

export function parser_config_file(config_string: string): Config {
  const data = toml.parse(config_string);
  return data as Config;
}
