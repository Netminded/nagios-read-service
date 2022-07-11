import { foo } from "./foo";
import { logger } from "./logger";

function app() {
  logger.info("Hello World");
  foo();
}

app();
