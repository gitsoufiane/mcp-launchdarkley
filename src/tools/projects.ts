import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ldRequest } from '../api.js';

interface Project {
  key: string;
  name: string;
  _environments?: unknown[];
}

interface ProjectsResponse {
  items?: Project[];
}

export function registerProjectTools(server: McpServer) {
  // Tool to list all projects
  server.tool('listProjects', {}, async (_, extra) => {
    try {
      const projects = await ldRequest('/projects') as ProjectsResponse;
      return {
        content: [
          {
            type: 'text',
            text: `Found ${projects.items?.length || 0} projects in LaunchDarkly.`,
          },
          {
            type: 'text',
            text: JSON.stringify(projects.items?.map((p: Project) => ({
              key: p.key,
              name: p.name,
              environments: p._environments?.length || 0,
            })) || [], null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching projects: ${errorMessage}`,
          },
        ],
      };
    }
  });
}
