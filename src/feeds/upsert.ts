import Feed from './feed';
import FeedResult from './feed_result';

export type BatchUpsert = (feeds: [Feed, FeedResult][]) => Promise<void>;
