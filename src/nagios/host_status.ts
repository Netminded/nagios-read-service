import {
  acknowledgement_type_to_enum,
  check_option_to_enum,
  check_type_number_to_enum,
  state_num_to_enum,
  state_type_to_enum,
} from './utils';

export default interface HostStatus {
  host_name: string;

  modified_attributes: number;
  check_command: string;
  check_period: string;
  notification_period: string;
  importance: number;
  check_interval: number;
  retry_interval: number;
  event_handler: string;

  has_been_checked: boolean;
  should_be_scheduled: boolean;
  check_execution_time: number;
  check_latency: number;
  // #define CHECK_TYPE_ACTIVE   0
  // #define CHECK_TYPE_PASSIVE  1
  // #define CHECK_TYPE_PARENT   2 /* (active) check for the benefit of dependent objects */
  // #define CHECK_TYPE_FILE     3 /* from spool files (yuck) */
  // #define CHECK_TYPE_OTHER    4 /* for modules to use */
  check_type: 'active' | 'passive' | 'parent' | 'file' | 'other';
  // #define STATE_OK			0
  // #define STATE_WARNING			1
  // #define STATE_CRITICAL			2
  // #define STATE_UNKNOWN			3
  // #define STATE_UP                0
  // #define STATE_DOWN              1
  // #define STATE_UNREACHABLE       2
  // /* for legacy reasons */
  // #define HOST_UP              STATE_UP
  // #define HOST_DOWN            STATE_DOWN
  // #define HOST_UNREACHABLE     STATE_UNREACHABLE
  current_state:
    | 'state_ok'
    | 'state_warning'
    | 'state_critical'
    | 'state_unknown';
  last_hard_state:
    | 'state_ok'
    | 'state_warning'
    | 'state_critical'
    | 'state_unknown';
  last_event_id: number;
  current_event_id: number;
  current_problem_id: number;
  last_problem_id: number;
  plugin_output: string;
  long_plugin_output: string;
  performance_data: string;
  last_check: number;
  next_check: number;
  // #define CHECK_OPTION_NONE		0	/* no check options */
  // #define CHECK_OPTION_FORCE_EXECUTION	1	/* force execution of a check (ignores disabled services/hosts, invalid timeperiods) */
  // #define CHECK_OPTION_FRESHNESS_CHECK    2       /* this is a freshness check */
  // #define CHECK_OPTION_ORPHAN_CHECK       4       /* this is an orphan check */
  // #define CHECK_OPTION_DEPENDENCY_CHECK   8       /* dependency check. different scheduling rules apply */
  check_options:
    | 'none'
    | {
        force_execution: boolean;
        freshness_check: boolean;
        orphan_check: boolean;
        dependency_check: boolean;
      };
  current_attempt: number;
  max_attempts: number;
  // #define SOFT_STATE			0
  // #define HARD_STATE			1
  state_type: 'soft_state' | 'hard_state';
  last_state_change: number;
  last_hard_state_change: number;
  last_time_up: number;
  last_time_down: number;
  last_time_unreachable: number;
  last_notification: number;
  next_notification: number;
  no_more_notifications: boolean;
  current_notification_number: number;
  current_notification_id: number;
  notifications_enabled: boolean;
  problem_has_been_acknowledged: boolean;
  // #define ACKNOWLEDGEMENT_NONE            0
  // #define ACKNOWLEDGEMENT_NORMAL          1
  // #define ACKNOWLEDGEMENT_STICKY          2
  acknowledgement_type: 'none' | 'normal' | 'sticky';
  active_checks_enabled: boolean;
  passive_checks_enabled: boolean;
  event_handler_enabled: boolean;
  flap_detection_enabled: boolean;
  process_performance_data: boolean;
  obsess: boolean;
  last_update: number;
  is_flapping: boolean;
  percent_state_change: number;
  scheduled_downtime_depth: number;
  custom_variables: {};
  // /* custom variables */
  // for(temp_customvariablesmember = temp_host->custom_variables; temp_customvariablesmember != NULL; temp_customvariablesmember = temp_customvariablesmember->next) {
  //   if(temp_customvariablesmember->variable_name)
  //     fprintf(fp, "\t_%s=%d;%s\n", temp_customvariablesmember->variable_name, temp_customvariablesmember->has_been_modified, (temp_customvariablesmember->variable_value == NULL) ? "" : temp_customvariablesmember->variable_value);
  // }
}

// Consumes lines from the status_file until a host status section has been parsed
export async function parse_host_status(
  rl: AsyncIterableIterator<string>
): Promise<HostStatus> {
  let host_status: HostStatus = <HostStatus>{};
  // Manually iterates through the line iterator
  let result = await rl.next();
  while (!result.done) {
    const line = result.value.trim();
    // The block has finished being parsed
    if (line === '}') {
      return host_status as HostStatus;
    } else if (line.startsWith('host_name=')) {
      host_status['host_name'] = line.split('host_name=')[1];
    } else if (line.startsWith('modified_attributes=')) {
      host_status['modified_attributes'] = Number.parseInt(
        line.split('modified_attributes=')[1]
      );
    } else if (line.startsWith('check_command=')) {
      host_status['check_command'] = line.split('check_command=')[1];
    } else if (line.startsWith('check_period=')) {
      host_status['check_period'] = line.split('check_period=')[1];
    } else if (line.startsWith('notification_period=')) {
      host_status['notification_period'] = line.split(
        'notification_period='
      )[1];
    } else if (line.startsWith('importance=')) {
      host_status['importance'] = Number.parseInt(line.split('importance=')[1]);
    } else if (line.startsWith('check_interval=')) {
      host_status['check_interval'] = Number.parseFloat(
        line.split('check_interval=')[1]
      );
    } else if (line.startsWith('retry_interval=')) {
      host_status['retry_interval'] = Number.parseFloat(
        line.split('retry_interval=')[1]
      );
    } else if (line.startsWith('event_handler=')) {
      host_status['event_handler'] = line.split('event_handler=')[1];
    } else if (line.startsWith('has_been_checked=')) {
      host_status['has_been_checked'] =
        line.split('has_been_checked=')[1] == '1';
    } else if (line.startsWith('should_be_scheduled=')) {
      host_status['should_be_scheduled'] =
        line.split('should_be_scheduled=')[1] == '1';
    } else if (line.startsWith('check_execution_time=')) {
      host_status['check_execution_time'] = Number.parseFloat(
        line.split('check_execution_time=')[1]
      );
    } else if (line.startsWith('check_latency=')) {
      host_status['check_latency'] = Number.parseFloat(
        line.split('check_latency=')[1]
      );
    } else if (line.startsWith('check_type=')) {
      host_status['check_type'] = check_type_number_to_enum(
        line.split('check_type=')[1]
      );
    } else if (line.startsWith('current_state=')) {
      host_status['current_state'] = state_num_to_enum(
        line.split('current_state=')[1]
      );
    } else if (line.startsWith('last_hard_state=')) {
      host_status['last_hard_state'] = state_num_to_enum(
        line.split('last_hard_state=')[1]
      );
    } else if (line.startsWith('last_event_id=')) {
      host_status['last_event_id'] = Number.parseInt(
        line.split('last_event_id=')[1]
      );
    } else if (line.startsWith('current_event_id=')) {
      host_status['current_event_id'] = Number.parseInt(
        line.split('current_event_id=')[1]
      );
    } else if (line.startsWith('current_problem_id=')) {
      host_status['current_problem_id'] = Number.parseInt(
        line.split('current_problem_id=')[1]
      );
    } else if (line.startsWith('last_problem_id=')) {
      host_status['last_problem_id'] = Number.parseInt(
        line.split('last_problem_id=')[1]
      );
    } else if (line.startsWith('plugin_output=')) {
      host_status['plugin_output'] = line.split('plugin_output=')[1];
    } else if (line.startsWith('long_plugin_output=')) {
      host_status['long_plugin_output'] = line.split('long_plugin_output=')[1];
    } else if (line.startsWith('performance_data=')) {
      host_status['performance_data'] = line.split('performance_data=')[1];
    } else if (line.startsWith('last_check=')) {
      host_status['last_check'] = Number.parseInt(line.split('last_check=')[1]);
    } else if (line.startsWith('next_check=')) {
      host_status['next_check'] = Number.parseInt(line.split('next_check=')[1]);
    } else if (line.startsWith('check_options=')) {
      host_status['check_options'] = check_option_to_enum(
        line.split('check_options=')[1]
      );
    } else if (line.startsWith('current_attempt=')) {
      host_status['current_attempt'] = Number.parseInt(
        line.split('current_attempt=')[1]
      );
    } else if (line.startsWith('max_attempts=')) {
      host_status['max_attempts'] = Number.parseInt(
        line.split('max_attempts=')[1]
      );
    } else if (line.startsWith('state_type=')) {
      host_status['state_type'] = state_type_to_enum(
        line.split('state_type=')[1]
      );
    } else if (line.startsWith('last_state_change=')) {
      host_status['last_state_change'] = Number.parseInt(
        line.split('last_state_change=')[1]
      );
    } else if (line.startsWith('last_hard_state_change=')) {
      host_status['last_hard_state_change'] = Number.parseInt(
        line.split('last_hard_state_change=')[1]
      );
    } else if (line.startsWith('last_time_up=')) {
      host_status['last_time_up'] = Number.parseInt(
        line.split('last_time_up=')[1]
      );
    } else if (line.startsWith('last_time_down=')) {
      host_status['last_time_down'] = Number.parseInt(
        line.split('last_time_down=')[1]
      );
    } else if (line.startsWith('last_time_unreachable=')) {
      host_status['last_time_unreachable'] = Number.parseInt(
        line.split('last_time_unreachable=')[1]
      );
    } else if (line.startsWith('last_notification=')) {
      host_status['last_notification'] = Number.parseInt(
        line.split('last_notification=')[1]
      );
    } else if (line.startsWith('next_notification=')) {
      host_status['next_notification'] = Number.parseInt(
        line.split('next_notification=')[1]
      );
    } else if (line.startsWith('no_more_notifications=')) {
      host_status['no_more_notifications'] =
        line.split('no_more_notifications=')[1] == '1';
    } else if (line.startsWith('current_notification_number=')) {
      host_status['current_notification_number'] = Number.parseInt(
        line.split('current_notification_number=')[1]
      );
    } else if (line.startsWith('current_notification_id=')) {
      host_status['current_notification_id'] = Number.parseInt(
        line.split('current_notification_id=')[1]
      );
    } else if (line.startsWith('notifications_enabled=')) {
      host_status['notifications_enabled'] =
        line.split('notifications_enabled=')[1] == '1';
    } else if (line.startsWith('problem_has_been_acknowledged=')) {
      host_status['problem_has_been_acknowledged'] =
        line.split('problem_has_been_acknowledged=')[1] == '1';
    } else if (line.startsWith('acknowledgement_type=')) {
      host_status['acknowledgement_type'] = acknowledgement_type_to_enum(
        line.split('acknowledgement_type=')[1]
      );
    } else if (line.startsWith('active_checks_enabled=')) {
      host_status['active_checks_enabled'] =
        line.split('active_checks_enabled=')[1] == '1';
    } else if (line.startsWith('passive_checks_enabled=')) {
      host_status['passive_checks_enabled'] =
        line.split('passive_checks_enabled=')[1] == '1';
    } else if (line.startsWith('event_handler_enabled=')) {
      host_status['event_handler_enabled'] =
        line.split('event_handler_enabled=')[1] == '1';
    } else if (line.startsWith('flap_detection_enabled=')) {
      host_status['flap_detection_enabled'] =
        line.split('flap_detection_enabled=')[1] == '1';
    } else if (line.startsWith('process_performance_data=')) {
      host_status['process_performance_data'] =
        line.split('process_performance_data=')[1] == '1';
    } else if (line.startsWith('obsess=')) {
      host_status['obsess'] = line.split('obsess=')[1] == '1';
    } else if (line.startsWith('last_update=')) {
      host_status['last_update'] = Number.parseInt(
        line.split('last_update=')[1]
      );
    } else if (line.startsWith('is_flapping=')) {
      host_status['is_flapping'] = line.split('is_flapping=')[1] == '1';
    } else if (line.startsWith('percent_state_change=')) {
      host_status['percent_state_change'] = Number.parseFloat(
        line.split('percent_state_change=')[1]
      );
    } else if (line.startsWith('scheduled_downtime_depth=')) {
      host_status['scheduled_downtime_depth'] = Number.parseInt(
        line.split('scheduled_downtime_depth=')[1]
      );
    }

    result = await rl.next();
  }
  return host_status;
}
