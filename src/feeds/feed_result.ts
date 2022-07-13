export default interface FeedResult {
  color: 'green' | 'amber' | 'red' | 'default';
  message: string;
  updated_at: Date;
}
