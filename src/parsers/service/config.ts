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

const service_feed_schema = {
  api_key: Joi.string().default('default'),
  organisation: Joi.object({ id: Joi.number() }).required(),
  page: Joi.object({ id: Joi.number() }).required(),
  space: Joi.object({ id: Joi.number() }).required(),
  // The naming scheme of the transparent feed for these services
  name: Joi.string().required(),
  // The description, defaults to the service description
  description: Joi.string().default('{{ service_description }}'),
  // The tags of the feed, these take priority over the feeds defining in nagios
  tags: Joi.array().items(Joi.string()).default([]),
};
const host_feed_schema = {
  ...service_feed_schema,
  // The description, defaults to `'check_command' for 'host_name'`
  description: Joi.string().default(
    "'{{ check_command }}' for '{{ host_name }}'"
  ),
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
          // Old format
          secret_key: Joi.string(),
          uuid: Joi.string(),
          // New format
          secret: Joi.string(),
          access_token: Joi.string(),
        })
          .xor('secret_key', 'secret')
          .xor('uuid', 'access_token')
          .required()
          .custom((value, _) => {
            // Maps the new api key format to the old
            if (value.secret !== undefined) {
              value.secret_key = value.secret;
            }
            if (value.access_token !== undefined) {
              value.uuid = value.access_token;
            }
            return value;
          })
      )
      .required(),
  })
    .required()
    .with('keys', 'keys.default'),
  exposures: Joi.object({
    services: Joi.array().items(
      Joi.object({
        // Which services does this feed exposure block apply to?
        // The match conditions are intersecting (i.e. AND)
        // If no match is provided, then it is assumed that this applies to no services
        match: Joi.object({
          host_name: Joi.string().custom(regex_validator),
          service_description: Joi.string().custom(regex_validator),
          check_command: Joi.string().custom(regex_validator),
        }).required(),
        // The feeds that all the services of this block expose
        feeds: Joi.object({
          // Do these services expose a 'transparent' feed?
          transparent: Joi.object(service_feed_schema),
          diagnostic: Joi.object({
            // Do these services expose a 'is_running' diagnostic feed?
            is_running: Joi.object(service_feed_schema),
          }),
          plugin: Joi.object({
            // Do these services expose a 'ping' plugin feed?
            ping: Joi.object(service_feed_schema),
          }),
        }).required(),
      })
    ),
    //
    hosts: Joi.array().items(
      Joi.object({
        // Which host does this feed exposure block apply to?
        // The match conditions are intersecting (i.e. AND)
        // If no match is provided, then it is assumed that this applies to no hosts
        match: Joi.object({
          host_name: Joi.string().custom(regex_validator),
          address: Joi.string().custom(regex_validator),
          check_command: Joi.string().custom(regex_validator),
        }).required(),
        feeds: Joi.object({
          status: Joi.object(host_feed_schema),
        }).required(),
      })
    ),
  }),
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

interface GenericFeed {
  // The name of the api key to use, defaults to 'default'
  api_key: string;
  // Who owns ths feed
  organisation: { id: number };
  page: { id: number };
  space: { id: number };
  // The naming scheme of the transparent feed for these services
  name: string;
  // The description, defaults to the service description
  description: string;
  // The tags of the feed, these take priority over the feeds defining in nagios
  tags: string[];
}

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
    services?: {
      // Which services does this feed exposure block apply to?
      // The match conditions are intersecting (i.e. AND)
      // If no match is provided, then it is assumed that this applies to no services
      match: {
        host_name?: RegExp;
        service_description?: RegExp;
        check_command?: RegExp;
      };
      // The feeds that all the services of this block expose
      feeds: {
        // Do these services expose a 'transparent' feed?
        transparent?: GenericFeed;
        diagnostic?: {
          // Do these services expose a 'is_running' diagnostic feed?
          is_running?: GenericFeed;
        };
        plugin?: {
          // Do these services expose a 'ping' plugin feed?
          ping?: GenericFeed;
        };
      };
    }[];
    //
    hosts?: {
      // Which hosts does this feed exposure block apply to?
      // The match conditions are intersection (i.e. AND)
      // If no match is provided, then it is assumed that this applies to no hosts
      match: {
        host_name?: RegExp;
        address?: RegExp;
        check_command?: RegExp;
      };
      feeds: {
        status: GenericFeed & {
          // The description, defaults to `'check_command' for 'host_name'`
          description: string;
        };
      };
    }[];
  };
}

export function parse_config_file(config_string: string): Config {
  const config = toml.parse(config_string);
  const { error, value } = config_schema.validate(config);
  if (error === undefined) {
    console.log(value.api.keys.default);
    return value;
  } else {
    throw error;
  }
}
