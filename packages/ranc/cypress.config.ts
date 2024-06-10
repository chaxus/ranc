import { defineConfig } from "cypress";
import { DEV_SERVER } from "./build/config";

export default defineConfig({
  e2e: {
    baseUrl: DEV_SERVER,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
