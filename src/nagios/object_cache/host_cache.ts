import * as Joi from 'joi';

export const host_schema = Joi.object({
  host_name: Joi.string().required(),
  display_name: Joi.string(),
  alias: Joi.string(),
  address: Joi.string(),
  parents: Joi.string().default(''),
  check_period: Joi.string(),
  check_command: Joi.string(),
  event_handler: Joi.string(),
  contacts: Joi.string().default(''),
  contact_groups: Joi.string().default(''),
  notification_period: Joi.string(),
  initial_state: Joi.string().regex(/[duo]/).required(),
  importance: Joi.number().required(),
  check_interval: Joi.number().required(),
  retry_interval: Joi.number().required(),
  max_check_attempts: Joi.number().required(),
  active_checks_enabled: Joi.boolean().falsy('0').truthy('1').required(),
  passive_checks_enabled: Joi.boolean().falsy('0').truthy('1').required(),
  obsess: Joi.boolean().falsy('0').truthy('1').required(),
  event_handler_enabled: Joi.boolean().falsy('0').truthy('1').required(),
  low_flap_threshold: Joi.number().required(),
  high_flap_threshold: Joi.number().required(),
  flap_detection_enabled: Joi.boolean().falsy('0').truthy('1').required(),
  flap_detection_options: Joi.string().required(),
  freshness_threshold: Joi.number().required(),
  check_freshness: Joi.boolean().falsy('0').truthy('1').required(),
  notification_options: Joi.string().required(),
  notifications_enabled: Joi.boolean().falsy('0').truthy('1').required(),
  notification_interval: Joi.number().required(),
  first_notification_delay: Joi.number().required(),
  stalking_options: Joi.string().required(),
  process_perf_data: Joi.boolean().falsy('0').truthy('1').required(),
  icon_image: Joi.string(),
  icon_image_alt: Joi.string(),
  vrml_image: Joi.string(),
  statusmap_image: Joi.string(),
  '2d_coords': Joi.string(),
  '3d_coords': Joi.string(),
  notes: Joi.string(),
  notes_url: Joi.string(),
  action_url: Joi.string(),
  retain_status_information: Joi.boolean().falsy('0').truthy('1').required(),
  retain_nonstatus_information: Joi.boolean().falsy('0').truthy('1').required(),
})
  .unknown(true)
  .custom((value, _) => {
    if (value.display_name === undefined) value.display_name = value.host_name;
    return value;
  });

export interface HostDeclaration {
  host_name: string;
  display_name: string;
  alias?: string;
  address?: string;
  parents: string;
  check_period?: string;
  check_command?: string;
  event_handler?: string;
  contacts: string;
  contact_groups: string;
  notification_period?: string;
  initial_state: string;
  importance: number;
  check_interval: number;
  retry_interval: number;
  max_check_attempts: number;
  active_checks_enabled: boolean;
  passive_checks_enabled: boolean;
  obsess: boolean;
  event_handler_enabled: boolean;
  low_flap_threshold: number;
  high_flap_threshold: number;
  flap_detection_enabled: boolean;
  flap_detection_options: string;
  freshness_threshold: number;
  check_freshness: boolean;
  notification_options: string;
  notifications_enabled: boolean;
  notification_interval: number;
  first_notification_delay: number;
  stalking_options: string;
  process_perf_data: boolean;
  icon_image?: string;
  icon_image_alt?: string;
  vrml_image?: string;
  statusmap_image?: string;
  '2d_coords'?: string;
  '3d_coords'?: string;
  notes?: string;
  notes_url?: string;
  action_url?: string;
  retain_status_information: boolean;
  retain_nonstatus_information: boolean;
}

// Uniquely identifies the host
export type UniqueHostId = string;
export function get_unique_host_id(host: { host_name: string }): UniqueHostId {
  return host.host_name;
}
