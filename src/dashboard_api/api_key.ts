import Config from '../config/config';
import axios from 'axios';
import { logger } from '../utils/logger';
import { interpolate_env_string } from '../utils/interpolation';

export interface ApiKeys {
  [key: string]: {
    type: 'jwt';
    secret_key: string;
    uuid: string;
    token?: string;
  };
}

// Extracts the api keys from the config file
export function extract_api_keys(config: Config): ApiKeys {
  const api_keys: ApiKeys = {};
  for (const name in config.api.keys) {
    api_keys[name] = config.api.keys[name];
  }
  return api_keys;
}

// Refreshes a jwt api token
export async function refresh_jwt_token(
  jwt_refresh_token_endpoint: string,
  name: string,
  secret_key: string,
  uuid: string
): Promise<string | null> {
  const result = await axios.post(jwt_refresh_token_endpoint, {
    secret_key: interpolate_env_string(secret_key), // Interpolates the string on demand
    uuid: interpolate_env_string(uuid), // Interpolates the string on demand
  });
  if (!result || !result?.data?.token) {
    logger.error(`Could not refresh jwt (named: ${name}) from dashboard`);
    return null;
  }
  return result.data.token;
}
