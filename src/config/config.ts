import * as toml from 'toml';
import * as Joi from 'joi';
import * as cron from 'cron-parser';

const regex_validator = (value: string, helpers: Joi.CustomHelpers) => {
  try {
    return new RegExp(value);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return helpers.message({ custom: e.message });
    } else {
      throw e;
    }
  }
};

const cron_validator = (value: string, helpers: Joi.CustomHelpers) => {
  try {
    cron.parseExpression(value);
    return value;
  } catch (e) {
    if (e instanceof Error) return helpers.message({ custom: e.message });
    else throw e;
  }
};

const config_schema = Joi.object({
  nagios_config_file_path: Joi.string()
    .default('/usr/local/nagios/etc/nagios.etc')
    .required(),
  poll_cron: Joi.string().custom(cron_validator).required(),
  batch_size: Joi.number().integer().positive().default(25),
  exposures: Joi.object({
    services: Joi.array()
      .items(
        Joi.object({
          // Which services does this feed exposure block apply to?
          // The match conditions are intersecting (i.e. AND)
          // If no match is provided, then it is assumed that this applies to no services
          match: Joi.object({
            service_description: Joi.string().custom(regex_validator),
            command: Joi.string().custom(regex_validator),
          }).required(),
          // The feeds that all the services of this block expose
          feeds: Joi.object({
            // Do these services expose a 'transparent' feed?
            transparent: Joi.object({
              organisation: Joi.object({ id: Joi.number() }).required(),
              page: Joi.object({ id: Joi.number() }).required(),
              space: Joi.object({ id: Joi.number() }).required(),
              // The naming scheme of the transparent feed for these services
              name: Joi.string().required(),
              // The description, defaults to the service description
              description: Joi.string().default('{{ service_description }}'),
            }),
            diagnostic: Joi.object({
              // Do these services expose a 'is_running' diagnostic feed?
              is_running: Joi.object({
                organisation: Joi.object({ id: Joi.number() }).required(),
                page: Joi.object({ id: Joi.number() }).required(),
                space: Joi.object({ id: Joi.number() }).required(),
                // The naming scheme of the transparent feed for these services
                name: Joi.string().required(),
                // The description, defaults to the service description
                description: Joi.string().default('{{ service_description }}'),
              }),
            }),
            plugin: Joi.object({
              // Do these services expose a 'ping' plugin feed?
              ping: Joi.object({
                organisation: Joi.object({ id: Joi.number() }).required(),
                page: Joi.object({ id: Joi.number() }).required(),
                space: Joi.object({ id: Joi.number() }).required(),
                // The naming scheme of the transparent feed for these services
                name: Joi.string().required(),
                // The description, defaults to the service description
                description: Joi.string().default('{{ service_description }}'),
              }),
            }),
          }).required(),
        })
      )
      .required(),
    //
    hosts: Joi.array().items(Joi.object({})),
  }).required(),
});

export default interface Config {
  nagios_config_file_path: string;
  poll_cron: number;
  // Defines how many feeds should be batched together before submitting to SeeThru.
  // Defaults to 25
  batch_size: number;
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
          organisation: { id: number };
          page: { id: number };
          space: { id: number };
          // The naming scheme of the transparent feed for these services
          name: any;
          // The description, defaults to the service description
          description: any;
        };
        diagnostic?: {
          // Do these services expose a 'is_running' diagnostic feed?
          is_running?: {
            organisation: { id: number };
            page: { id: number };
            space: { id: number };
            // The naming scheme of the is_running diagnostic feed for these services
            name: any;
            // The description, defaults to the service description
            description: any;
          };
        };
        plugin?: {
          // Do these services expose a 'ping' plugin feed?
          ping?: {
            organisation: { id: number };
            page: { id: number };
            space: { id: number };
            // The naming scheme of the ping plugin feed for these services
            name: any;
            // The description, defaults to the service description
            description: any;
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
    throw error;
  }
}
