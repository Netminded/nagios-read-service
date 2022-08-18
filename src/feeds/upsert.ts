import Feed from './feed';
import FeedResult from './result_maps/feed_result';

export type BatchUpsert = (feeds: [Feed, FeedResult][]) => Promise<void>;
