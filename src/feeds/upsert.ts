import FeedResult from './feed_result';
import Feed from './feed';

interface UpsertFeed {
  integration_id: string;
  name: string;
  description: string;
  organisationId: number;
  spaceId: number;
  pageId: number;
  color: 'green' | 'amber' | 'red' | 'default';
  message: string;
  dependencies: number[];
  custom_data: {};
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
    dependencies: feed.dependencies,
    color: result.color,
    message: result.message,
    custom_data: {},
  };
}

// // Upserts the feed to the dashboard
// async function upsert(url: URL, feed: Feed, result: FeedResult) {
//   let config = {
//     headers: {
//       Accept: 'application/json',
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${laravelJwtToken}`,
//     },
//   };
//
//   const body = {
//     feeds: [feed_upsert_map(feed, result)],
//   };
//
//   await axios.put(url.toString(), body, config);
// }
//
// // Batch upserts feeds to the dashboard
// async function batch_upsert(url: URL, feeds: [Feed, FeedResult][]) {
//   let config = {
//     headers: {
//       Accept: 'application/json',
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${laravelJwtToken}`,
//     },
//   };
//
//   const body = {
//     feeds: feeds.map(([feed, result]) => feed_upsert_map(feed, result)),
//   };
//
//   await axios.put(url.toString(), body, config);
// }
