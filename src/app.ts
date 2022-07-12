// Initialises the project-wide logger
import { logger } from './logger';
import { parse_nagios_status_file } from './parse_nagios_status_dat';
import fs from 'fs';
import ServiceStatus from "./nagios/service_status";

interface FeedResult {
  color: "green" | "amber" | "red" | "default",
  message: string,
  updated_at: Date
}

function map_service_to_transparent_feed(service: ServiceStatus): FeedResult | null {
  if (service.state_type === "hard_state") {
    let colour: "green" | "amber" | "red" | "default" = "default";
    switch (service.current_state) {
      case "state_ok":
        colour = "green";
        break;
      case "state_warning":
        colour = "amber";
        break;
      case "state_critical":
        colour = "red";
        break;
      case "state_unknown":
        colour = "default";
        break;
    }
    return {
      color: colour,
      message: service.plugin_output,
      updated_at: new Date()
    };
  }
  // With a soft state, we should wait for nagios to turn to a hard state
  else {
    return null;
  }
}

async function app() {
  const stream = fs.createReadStream(
    `${__dirname}/../examples/example_status.dat`,
    'utf-8'
  );
  const status_iter = parse_nagios_status_file(stream);
  for await (const status of status_iter) {
    if (status !== null) {
      if (status.type === "ServiceStatus") {
        logger.info(`Service Status with check_command ${status.status.check_command}`);
        const feed_result = map_service_to_transparent_feed(status.status);
        logger.info(feed_result, `Mapped service \`${status.status.service_description}\`@\`${status.status.host_name}\` to feed result`);
      }
    }
  }
}

app().then(() => {});
