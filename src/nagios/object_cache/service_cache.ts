import * as Joi from 'joi';

export const service_schema = Joi.object({
  host_name: Joi.string().required(),
  service_description: Joi.string().required(),
  display_name: Joi.string(),
  parents: Joi.string(), // Either `parent.service_description` if the parent service has the same host.
  // Or if many parents, then a comma separated list of parent.host,parent.service_description
  check_period: Joi.string(),
  check_command: Joi.string(),
  event_handler: Joi.string(),
  notification_period: Joi.string(),
  initial_state: Joi.string().required(), // TODO: Refine
  importance: Joi.number().required(),
  check_interval: Joi.number().required(),
  retry_interval: Joi.number().required(),
  max_check_attempts: Joi.number().required(),
  is_volatile: Joi.bool().falsy('0').truthy('1').required(),
  parallelize_check: Joi.bool().falsy('0').truthy('1').required(),
  active_checks_enabled: Joi.bool().falsy('0').truthy('1').required(),
  passive_checks_enabled: Joi.bool().falsy('0').truthy('1').required(),
  obsess: Joi.bool().falsy('0').truthy('1').required(),
  event_handler_enabled: Joi.bool().falsy('0').truthy('1').required(),
  low_flap_threshold: Joi.number().required(),
  high_flap_threshold: Joi.number().required(),
  flap_detection_enabled: Joi.bool().falsy('0').truthy('1').required(),
  flap_detection_options: Joi.string().required(), // TODO: Refine
  freshness_threshold: Joi.number().required(),
  check_freshness: Joi.bool().falsy('0').truthy('1').required(),
  notification_options: Joi.string().required(), // TODO: Refine
  notifications_enabled: Joi.bool().falsy('0').truthy('1').required(),
  notification_interval: Joi.number().required(),
  first_notification_delay: Joi.number().required(),
  stalking_options: Joi.string().required(), // TODO: Refine
  process_perf_data: Joi.bool().falsy('0').truthy('1').required(),
  icon_image: Joi.string(),
  icon_image_alt: Joi.string(),
  notes: Joi.string(),
  notes_url: Joi.string(),
  action_url: Joi.string(),
  retain_status_information: Joi.bool().falsy('0').truthy('1').required(),
  retain_nonstatus_information: Joi.bool().falsy('0').truthy('1').required(),

  /* custom variables */
  // fcache_customvars(fp, temp_service->custom_variables);
  // fprintf(fp, "\t}\n\n");
})
  .unknown(true)
  .custom((value, _) => {
    if (value.display_name === undefined)
      value.display_name = value.service_description;
    return value;
  });

export default interface ServiceDeclaration {
  host_name: string;
  service_description: string;
  display_name: string;
  parents: string; // Either `parent.service_description` if the parent service has the same host.
  check_period: string;
  check_command: string;
  event_handler: string;
  notification_period: string;
  initial_state: string; // TODO: Refine
  importance: boolean;
  check_interval: boolean;
  retry_interval: boolean;
  max_check_attempts: boolean;
  is_volatile: boolean;
  parallelize_check: boolean;
  active_checks_enabled: boolean;
  passive_checks_enabled: boolean;
  obsess: boolean;
  event_handler_enabled: boolean;
  low_flap_threshold: boolean;
  high_flap_threshold: boolean;
  flap_detection_enabled: boolean;
  flap_detection_options: string; // TODO: Refine
  freshness_threshold: boolean;
  check_freshness: boolean;
  notification_options: string; // TODO: Refine
  notifications_enabled: boolean;
  notification_interval: boolean;
  first_notification_delay: boolean;
  stalking_options: string; // TODO: Refine
  process_perf_data: boolean;
  icon_image: string;
  icon_image_alt: string;
  notes: string;
  notes_url: string;
  action_url: string;
  retain_status_information: boolean;
  retain_nonstatus_information: boolean;
}
