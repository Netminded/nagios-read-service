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
  api: Joi.object({
    // The full url of the endpoint
    upsert_endpoint: Joi.string().uri().required(),
    jwt_key_refresh_endpoint: Joi.string().uri().required(),
    keys: Joi.object()
      .pattern(
        Joi.string(),
        Joi.object({
          type: Joi.string().pattern(/jwt/).required(),
          secret_key: Joi.string().required(),
          uuid: Joi.string().required(),
        }).required()
      )
      .required(),
  })
    .required()
    .with('keys', 'keys.default'),
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

type ApiKey = {
  type: 'jwt';
  // The two credentials needed to generate jwts, these may be interpolated at a later stage
  // with env interpolation, i.e. occurrences of {! <ENV_NAME> !} get replaced
  // with the env variable named <ENV_NAME>.
  //
  // These should be interpolated on demand, never stored in the config itself
  secret_key: string;
  uuid: string;
};

export default interface Config {
  nagios_config_file_path: string;
  poll_cron: number;
  // Defines how many feeds should be batched together before submitting to SeeThru.
  // Defaults to 25
  batch_size: number;
  api: {
    // The full url of the endpoint
    upsert_endpoint: string;
    jwt_key_refresh_endpoint: string;
    // Named api keys, as they are named, different api keys, and/or types can be
    // used for different feeds. You should always have a default
    keys: {
      default: ApiKey;
      [key: string]: ApiKey;
    };
  };
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
          // The name of the api key to use, defaults to 'default'
          api_key: string;
          // Who owns ths feed
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
            // The name of the api key to use, defaults to 'default'
            api_key: string;
            // Who owns ths feed
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
            // The name of the api key to use, defaults to 'default'
            api_key: string;
            // Who owns ths feed
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
  // @ts-ignore
  const {
    error,
    value,
  }:
    | { error: undefined; warning?: Joi.ValidationError; value: Config }
    | {
        error: Joi.ValidationError;
        warning?: Joi.ValidationError;
        value: Config;
      } = config_schema.validate(config);
  if (error === undefined) {
    return value;
  } else {
    throw error;
  }
}
