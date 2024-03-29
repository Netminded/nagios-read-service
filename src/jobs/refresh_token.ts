import Config from '../parsers/service/config';
import { logger } from '../utils/logger';
import * as schedule from 'node-schedule';
import { ApiKeys, refresh_jwt_token } from '../dashboard_api/api_key';

// Starts the job which updates api tokens (/refreshes from the dashboard)
// The api_keys object is updated in place with refreshed tokens
export default function start_refresh_token_job(
  config: Config,
  api_keys: ApiKeys
) {
  logger.info("Starting 'Refresh Api Token' job");
  const job = schedule.scheduleJob('*/30 * * * *', async function () {
    logger.info('Refreshing api tokens');

    try {
      for (const name in api_keys) {
        const key = api_keys[name];
        // Handle jwt
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
    } catch (e) {
      if (e instanceof Error)
        logger.error({
          message: `Failed to refresh token: '${e.message}'. Continuing`,
          error: e,
        });
      else logger.error(e);
    }
  });
  // Runs the job for a first time, to fetch the first set of tokens
  job.invoke();
  return job;
}
