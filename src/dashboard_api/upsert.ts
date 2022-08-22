import Feed from '../feeds/feed';
import FeedResult from '../feeds/result_maps/feed_result';
import axios from 'axios';
import { logger } from '../utils/logger';

interface UpsertFeed {
  integration_id: string;
  name: string;
  description: string;
  organisationId: number;
  spaceId: number;
  pageId: number;
  color: 'green' | 'amber' | 'red' | 'default';
  message: string;
  dependencies: {
    type: 'integration_id';
    id: string;
  }[];
  // An iso formatted date
  updatedAt: string;
  custom_data: {
    tags?: string; // The dashboard requires that tags are a comma separated string
  };
}

// Maps a feed and feed result into an UpsertFeed (which can be upserted to the dashboard)
function feed_upsert_map(feed: Feed, result: FeedResult): UpsertFeed {
  return {
    integration_id: feed.integration_id,
    name: feed.name,
    description: feed.description,
    organisationId: feed.organisationId,
    spaceId: feed.spaceId,
    pageId: feed.pageId,
    dependencies: feed.dependencies.map((d) => {
      return { type: 'integration_id', id: d };
    }),
    color: result.color,
    message: result.message,
    updatedAt: result.updated_at.toISOString(),
    custom_data: {
      tags: feed.custom_data.tags?.join(','),
    },
  };
}

// Upserts the feed to the dashboard
export async function api_upsert(
  api_token: string,
  url: URL,
  feed: Feed,
  result: FeedResult
) {
  const config = {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${api_token}`,
    },
  };

  const body = {
    feeds: [feed_upsert_map(feed, result)],
  };

  await axios.post(url.toString(), body, config);
}

// Batch upserts feeds to the dashboard
export async function batch_api_upsert(
  url: URL,
  api_token: string,
  feeds: [Feed, FeedResult][]
) {
  const config = {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${api_token}`,
    },
  };

  const body = {
    feeds: feeds.map(([feed, result]) => feed_upsert_map(feed, result)),
  };

  const response = await axios.post(url.toString(), body, config);
  logger.debug({
    message: 'Received response from api: ',
    response: response,
  });
  if (response.status === 404)
    throw Error(`Api upsert endpoint '${url}' does not exist`);
  else if (response.status !== 200)
    throw Error(`Api upsert endpoint returned non 200 response`);
  else if (!response.data.success)
    throw Error(`Api upsert failed, with response: ${response.data.message}`);
}
