import HostStatus from '../../../parsers/nagios/status/blocks/host_status_block';
import FeedResult from '../feed_result';

export function map_host_to_status_feed(host_status: HostStatus): FeedResult {
  switch (host_status.current_state) {
    case 'state_up':
      return {
        color: 'green',
        message: `The host is up, received plugin output '${host_status.plugin_output}'`,
        updated_at: new Date(),
      };
    case 'state_down':
      return {
        color: 'red',
        message: `The host is down, received plugin output '${host_status.plugin_output}'`,
        updated_at: new Date(),
      };
    case 'state_unreachable':
      return {
        color: 'red',
        message: `The host is unreachable, received plugin output '${host_status.plugin_output}'`,
        updated_at: new Date(),
      };
  }
}
