import Config from '../config/config';
import { logger } from '../utils/logger';
import * as schedule from 'node-schedule';
import { ApiKeys, refresh_jwt_token } from '../dashboard_api/api_key';

export default function start_refresh_token_job(
  config: Config,
  api_keys: ApiKeys
) {
  logger.info("Starting 'Refresh Api Token' job");
  return schedule.scheduleJob('*/30 * * * *', async function () {
    for (const name in api_keys) {
      let key = api_keys[name];
      if (key.type === 'jwt') {
        const token = await refresh_jwt_token(
          config.api.jwt_key_refresh_endpoint,
          name,
          key.secret_key,
          key.uuid
        );
        if (token !== null) key.token = token;
      }
    }
  });
}
