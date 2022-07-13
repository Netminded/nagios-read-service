import * as toml from 'toml';
import * as Joi from "joi";

const regex_validator = (value: string, helpers: Joi.CustomHelpers) => {
  try {
    return new RegExp(value);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return helpers.message({custom: e.message});
    } else {
      throw e;
    }
  }
}

const config_schema = Joi.object({
  nagios_config_file_path: Joi.string().required(),
  check_interval: Joi.number().required(),
  exposures: Joi.object({
    services: Joi.array().items(Joi.object({
      // Which services does this feed exposure block apply to?
      // The match conditions are intersecting (i.e. AND)
      // If no match is provided, then it is assumed that this applies to no services
      match: Joi.object({
        service_description: Joi.string().custom(regex_validator),
        command: Joi.string().custom(regex_validator)
      }).required(),
      // The feeds that all the services of this block expose
      feeds: Joi.object({
        // Do these services expose a 'transparent' feed?
        transparent: Joi.object({
          page: Joi.object({ id: Joi.number() }).required(),
          space: Joi.object({ id: Joi.number() }).required(),
          // The naming scheme of the transparent feed for these services
          naming_scheme: Joi.string().required() // TODO
        }),
        diagnostic: Joi.object({
          // Do these services expose a 'is_running' diagnostic feed?
          is_running: Joi.object({
            page: Joi.object({ id: Joi.number() }).required(),
            space: Joi.object({ id: Joi.number() }).required(),
            // The naming scheme of the transparent feed for these services
            naming_scheme: Joi.string().required() // TODO
          })
        }),
        plugin: Joi.object({
          // Do these services expose a 'ping' plugin feed?
          ping: Joi.object({
            page: Joi.object({ id: Joi.number() }).required(),
            space: Joi.object({ id: Joi.number() }).required(),
            // The naming scheme of the transparent feed for these services
            naming_scheme: Joi.string().required() // TODO
          })
        })
      }).required()
    })).required(),
    //
    hosts: Joi.array().items(Joi.object({})).required()
  }).required()
})

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
        service_description?: RegExp;
        command?: RegExp;
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

export function parse_config_file(config_string: string): Config {
  const config = toml.parse(config_string);
  const { error, value } = config_schema.validate(config);
  if (error === undefined) {
    return value;
  } else {
    throw error
  }
}
