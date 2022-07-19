// #define CHECK_TYPE_ACTIVE   0
// #define CHECK_TYPE_PASSIVE  1
// #define CHECK_TYPE_PARENT   2 /* (active) check for the benefit of dependent objects */
// #define CHECK_TYPE_FILE     3 /* from spool files (yuck) */
// #define CHECK_TYPE_OTHER    4 /* for modules to use */
export function check_type_number_to_enum(
  check_type: string
): 'active' | 'passive' | 'parent' | 'file' | 'other' {
  switch (check_type) {
    case '0':
      return 'active';
    case '1':
      return 'passive';
    case '2':
      return 'parent';
    case '3':
      return 'file';
    default:
      return 'other';
  }
}

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
export function state_num_to_enum(
  state_num: string
): 'state_ok' | 'state_warning' | 'state_critical' | 'state_unknown' {
  switch (state_num) {
    case '0':
      return 'state_ok';
    case '1':
      return 'state_warning';
    case '2':
      return 'state_critical';
    default:
      return 'state_unknown';
  }
}

// #define CHECK_OPTION_NONE		0	/* no check options */
// #define CHECK_OPTION_FORCE_EXECUTION	1	/* force execution of a check (ignores disabled services/hosts, invalid timeperiods) */
// #define CHECK_OPTION_FRESHNESS_CHECK    2       /* this is a freshness check */
// #define CHECK_OPTION_ORPHAN_CHECK       4       /* this is an orphan check */
// #define CHECK_OPTION_DEPENDENCY_CHECK   8       /* dependency check. different scheduling rules apply */
export function check_option_to_enum(check_option: string):
  | 'none'
  | {
      force_execution: boolean;
      freshness_check: boolean;
      orphan_check: boolean;
      dependency_check: boolean;
    } {
  const byte = Number.parseInt(check_option);
  if (byte == 0) {
    return 'none';
  } else {
    const parsed = {
      force_execution: false,
      freshness_check: false,
      orphan_check: false,
      dependency_check: false,
    };
    if (byte & 0x01) {
      parsed.force_execution = true;
    }
    if (byte & 0x02) {
      parsed.freshness_check = true;
    }
    if (byte & 0x04) {
      parsed.orphan_check = true;
    }
    if (byte & 0x08) {
      parsed.dependency_check = true;
    }
    return parsed;
  }
}

// #define SOFT_STATE			0
// #define HARD_STATE			1
export function state_type_to_enum(
  state_type: string
): 'soft_state' | 'hard_state' {
  if (state_type == '0') {
    return 'soft_state';
  } else {
    return 'hard_state';
  }
}

// #define ACKNOWLEDGEMENT_NONE            0
// #define ACKNOWLEDGEMENT_NORMAL          1
// #define ACKNOWLEDGEMENT_STICKY          2
export function acknowledgement_type_to_enum(
  acknowledgment_type: string
): 'none' | 'normal' | 'sticky' {
  if (acknowledgment_type == '0') {
    return 'none';
  } else if (acknowledgment_type == '1') {
    return 'normal';
  } else {
    return 'sticky';
  }
}
