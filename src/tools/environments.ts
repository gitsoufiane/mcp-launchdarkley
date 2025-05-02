import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ldRequest } from '../api.js';

// Note: Most fields are marked as optional due to limited API response data
interface Environment {
  key: string;
  name: string;
  color: string;
  _id?: string;
  _default?: boolean;
  _version?: number;
  apiKey?: string;
  mobileKey?: string;
  clientSideID?: string;
  tags?: string[];
  secureMode?: boolean;
  defaultTTL?: number;
  confirmChanges?: boolean;
  requireComments?: boolean;
  approvalSettings?: {
    required: boolean;
    canReviewOwnRequest: boolean;
    minNumApprovals: number;
    canApplyDeclinedChanges: boolean;
  };
}

interface EnvironmentsResponse {
  items: Environment[];
  _links: { [key: string]: { href: string } };
  totalCount: number;
}

export function registerEnvironmentTools(server: McpServer) {
  // Tool to list all environments in a project
  server.tool('listEnvironments', {
    projectKey: z.string().describe('The project key to list environments for'),
  }, async ({ projectKey }, extra) => {
    try {
      let allEnvironments: Environment[] = [];
      let nextPageUrl: string | undefined = `/projects/${projectKey}/environments`;

      while (nextPageUrl) {
        const response = await ldRequest(nextPageUrl) as EnvironmentsResponse;
        allEnvironments = allEnvironments.concat(response.items);
        nextPageUrl = response._links.next?.href;
      }

      const limitedDataNote = "Note: Only basic environment information (key, name, color) is available. This may be due to API permissions or configuration.";

      const environmentsData = JSON.stringify(allEnvironments.map((env: Environment) => ({
        key: env.key,
        name: env.name,
        color: env.color,
        // Include other fields only if they are present in the API response
        ...(env._default !== undefined && { default: env._default }),
        ...(env.clientSideID && { clientSideID: env.clientSideID }),
        ...(env.mobileKey && { mobileKey: env.mobileKey }),
        ...(env.secureMode !== undefined && { secureMode: env.secureMode }),
        ...(env.tags && { tags: env.tags }),
        ...(env.apiKey && { apiKey: '********' }), // Mask the API key for security
        ...(env._id && { _id: env._id }),
        ...(env._version !== undefined && { _version: env._version }),
        ...(env.defaultTTL !== undefined && { defaultTTL: env.defaultTTL }),
        ...(env.confirmChanges !== undefined && { confirmChanges: env.confirmChanges }),
        ...(env.requireComments !== undefined && { requireComments: env.requireComments }),
        ...(env.approvalSettings && { approvalSettings: env.approvalSettings }),
      })), null, 2);

      return {
        content: [
          {
            type: 'text',
            text: `Found ${allEnvironments.length} environments in project "${projectKey}".\n\n${limitedDataNote}\n\n${environmentsData}`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof Error) {
        if ('status' in error && typeof error.status === 'number') {
          // Handle specific HTTP errors
          switch (error.status) {
            case 404:
              return { content: [{ type: 'text', text: `Project "${projectKey}" not found.` }] };
            case 401:
              return { content: [{ type: 'text', text: 'Unauthorized. Please check your API key.' }] };
            default:
              return { content: [{ type: 'text', text: `Error fetching environments: ${error.message}` }] };
          }
        }
        return { content: [{ type: 'text', text: `Error fetching environments: ${error.message}` }] };
      }
      return { content: [{ type: 'text', text: `Unknown error fetching environments: ${String(error)}` }] };
    }
  });
}
