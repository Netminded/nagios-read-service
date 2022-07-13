import ServiceStatus from '../../nagios/status/service_status_block';
import FeedResult from '../feed_result';

export default function map_service_to_transparent_feed(
  service: ServiceStatus
): FeedResult | null {
  if (service.state_type === 'hard_state') {
    let colour: 'green' | 'amber' | 'red' | 'default' = 'default';
    switch (service.current_state) {
      case 'state_ok':
        colour = 'green';
        break;
      case 'state_warning':
        colour = 'amber';
        break;
      case 'state_critical':
        colour = 'red';
        break;
      case 'state_unknown':
        colour = 'default';
        break;
    }
    return {
      color: colour,
      message: service.plugin_output,
      updated_at: new Date(),
    };
  }
  // With a soft state, we should wait for nagios to turn to a hard state
  else {
    return null;
  }
}
