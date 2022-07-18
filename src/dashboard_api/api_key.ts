import Config from '../config/config';
import axios from 'axios';
import { logger } from '../utils/logger';

export interface ApiKeys {
  [key: string]: {
    type: 'jwt';
    secret_key: string;
    uuid: string;
    token?: string;
  };
}

export function extract_api_keys(config: Config): ApiKeys {
  let api_keys: ApiKeys = {};
  for (const name in config.api.keys) {
    api_keys[name] = config.api.keys[name];
  }
  return api_keys;
}

export async function refresh_jwt_token(
  jwt_refresh_token_endpoint: string,
  name: string,
  secret_key: string,
  uuid: string
): Promise<string | null> {
  const result = await axios.post(jwt_refresh_token_endpoint, {
    secret_key: secret_key,
    uuid: uuid,
  });
  if (!result || !result?.data?.token) {
    logger.error(`Could not refresh jwt (named: ${name}) from dashboard`);
    return null;
  }
  return result.data.token;
}
