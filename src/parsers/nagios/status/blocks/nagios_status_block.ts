export default interface NagiosProgramStatus {
  modified_host_attributes: number;
  modified_service_attributes: number;
  nagios_pid: number;
  daemon_mode: number;
  program_start: number;
  last_log_rotation: number;
  enable_notifications: number;
  active_service_checks_enabled: number;
  passive_service_checks_enabled: number;
  active_host_checks_enabled: number;
  passive_host_checks_enabled: number;
  enable_event_handlers: number;
  obsess_over_services: number;
  obsess_over_hosts: number;
  check_service_freshness: number;
  check_host_freshness: number;
  enable_flap_detection: number;
  process_performance_data: number;
  global_host_event_handler: string;
  global_service_event_handler: string;
  next_comment_id: number;
  next_downtime_id: number;
  next_event_id: number;
  next_problem_id: number;
  next_notification_id: number;
  active_scheduled_host_check_stats: [number, number, number];
  active_ondemand_host_check_stats: [number, number, number];
  passive_host_check_stats: [number, number, number];
  active_scheduled_service_check_stats: [number, number, number];
  active_ondemand_service_check_stats: [number, number, number];
  passive_service_check_stats: [number, number, number];
  cached_host_check_stats: [number, number, number];
  cached_service_check_stats: [number, number, number];
  external_command_stats: [number, number, number];

  parallel_host_check_stats: [number, number, number];
  serial_host_check_stats: [number, number, number];
}
