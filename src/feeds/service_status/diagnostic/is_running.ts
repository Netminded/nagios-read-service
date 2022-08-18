// A diagnostic feed
import ServiceStatus from '../../../nagios/status/service_status_block';
import FeedResult from '../../feed_result';

export default function map_service_to_diagnostic_is_running_feed(
  service: ServiceStatus
): FeedResult | null {
  if (service.state_type === 'hard_state') {
    let colour: 'green' | 'amber' | 'red' | 'default';
    // TODO Message
    const message = service.plugin_output;

    if (service.plugin_output.toLowerCase().includes('ok')) {
      colour = 'green';
    } else {
      colour = 'red';
    }

    return {
      color: colour,
      message: message,
      updated_at: new Date(),
    };
  }
  // With a soft state, we should wait for nagios to turn to a hard state
  else {
    return null;
  }
}
