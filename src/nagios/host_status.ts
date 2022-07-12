export default interface HostStatus {
  host_name: string,

  modified_attributes: number,
  check_command: string,
  check_period: string,
  notification_period: string,
  importance: number,
  check_interval: number,
  retry_interval: number,
  event_handler: string,

  has_been_checked: boolean,
  should_be_scheduled: boolean,
  check_execution_time: number,
  check_latency: number,
  // #define CHECK_TYPE_ACTIVE   0
  // #define CHECK_TYPE_PASSIVE  1
  // #define CHECK_TYPE_PARENT   2 /* (active) check for the benefit of dependent objects */
  // #define CHECK_TYPE_FILE     3 /* from spool files (yuck) */
  // #define CHECK_TYPE_OTHER    4 /* for modules to use */
  check_type: "active" | "passive" | "parent" | "file" | "other",
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
  current_state: "state_ok" | "state_warning" | "state_critical" | "state_unknown" | "state_up" | "state_down" | "state_unreachable",
  last_hard_state: "state_ok" | "state_warning" | "state_critical" | "state_unknown" | "state_up" | "state_down" | "state_unreachable",
  last_event_id: number,
  current_event_id: number,
  current_problem_id: number,
  last_problem_id: number,
  plugin_output: string,
  long_plugin_output: string,
  performance_data: string,
  last_check: number,
  next_check: number,
  // #define CHECK_OPTION_NONE		0	/* no check options */
  // #define CHECK_OPTION_FORCE_EXECUTION	1	/* force execution of a check (ignores disabled services/hosts, invalid timeperiods) */
  // #define CHECK_OPTION_FRESHNESS_CHECK    2       /* this is a freshness check */
  // #define CHECK_OPTION_ORPHAN_CHECK       4       /* this is an orphan check */
  // #define CHECK_OPTION_DEPENDENCY_CHECK   8       /* dependency check. different scheduling rules apply */
  check_options: "none" | "force_execution" | "freshness_check" | "orphan_check" | "dependency_check"
  current_attempt: number,
  max_attempts: number,
  // #define SOFT_STATE			0
  // #define HARD_STATE			1
  state_type: "soft_state" | "hard_state",
  last_state_change: number,
  last_hard_state_change: number,
  last_time_up: number,
  last_time_down: number,
  last_time_unreachable: number,
  last_notification: number,
  next_notification: number,
  no_more_notifications: boolean,
  current_notification_number: number,
  current_notification_id: number,
  notifications_enabled: boolean,
  problem_has_been_acknowledged: boolean,
  // #define ACKNOWLEDGEMENT_NONE            0
  // #define ACKNOWLEDGEMENT_NORMAL          1
  // #define ACKNOWLEDGEMENT_STICKY          2
  acknowledgement_type: "none" | "normal" | "sticky",
  active_checks_enabled: boolean,
  passive_checks_enabled: boolean,
  event_handler_enabled: boolean,
  flap_detection_enabled: boolean,
  process_performance_data: boolean,
  obsess: boolean,
  last_update: number,
  is_flapping: boolean,
  percent_state_change: number,
  scheduled_downtime_depth: number,
  custom_variables: {}
// /* custom variables */
// for(temp_customvariablesmember = temp_host->custom_variables; temp_customvariablesmember != NULL; temp_customvariablesmember = temp_customvariablesmember->next) {
//   if(temp_customvariablesmember->variable_name)
//     fprintf(fp, "\t_%s=%d;%s\n", temp_customvariablesmember->variable_name, temp_customvariablesmember->has_been_modified, (temp_customvariablesmember->variable_value == NULL) ? "" : temp_customvariablesmember->variable_value);
// }
}