import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerProjectTools } from './projects.js';
import { registerEnvironmentTools } from './environments.js';
import { registerFeatureFlagTools } from './featureFlags.js';
import { registerSearchTools } from './search.js';
import { registerExperimentTools } from './experiments.js';

export function registerAllTools(server: McpServer) {
  registerProjectTools(server);
  registerEnvironmentTools(server);
  registerFeatureFlagTools(server);
  registerSearchTools(server);
  registerExperimentTools(server);
}
