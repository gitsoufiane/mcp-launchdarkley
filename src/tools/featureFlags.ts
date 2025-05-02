import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ldRequest } from '../api.js';

interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
  kind: string;
  temporary?: boolean;
  _maintainer?: { name: string };
  _tags?: string[];
  variations?: unknown[];
  defaults?: Record<string, unknown>;
  _links?: Record<string, unknown>;
  _archived?: boolean;
  clientSideAvailability?: { usingMobileKey?: boolean };
  _creationDate?: string;
  _contexts?: unknown[];
  environments?: Record<string, unknown>;
}

interface FlagStatus {
  name?: string;
  _status?: Record<string, unknown>;
  _lastRequested?: string;
  on?: boolean;
  _archived?: boolean;
  rules?: unknown[];
  fallthrough?: unknown;
  offVariation?: unknown;
  prerequisites?: unknown[];
  environments?: Record<string, FlagStatus>;
}

interface FlagsResponse {
  items?: FeatureFlag[];
}

export function registerFeatureFlagTools(server: McpServer) {
  // Tool to list feature flags in a project
  server.tool('listFeatureFlags', {
    projectKey: z.string().describe('The project key to list feature flags for'),
    query: z.string().optional().describe('Optional query to filter feature flags'),
    limit: z.number().min(1).max(100).default(20).optional().describe('Maximum number of flags to return'),
    offset: z.number().min(0).default(0).optional().describe('Offset for pagination'),
    tag: z.string().optional().describe('Filter by tag'),
  }, async ({ projectKey, query, limit, offset, tag }, extra) => {
    try {
      let endpoint = `/flags/${projectKey}`;
      const queryParams = [];
      
      if (limit) queryParams.push(`limit=${limit}`);
      if (offset) queryParams.push(`offset=${offset}`);
      if (query) queryParams.push(`filter=${encodeURIComponent(query)}`);
      if (tag) queryParams.push(`tag=${encodeURIComponent(tag)}`);
      
      if (queryParams.length > 0) {
        endpoint += `?${queryParams.join('&')}`;
      }
      
      const flags = await ldRequest(endpoint) as FlagsResponse;
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${flags.items?.length || 0} feature flags in project "${projectKey}".`,
          },
          {
            type: 'text',
            text: JSON.stringify(flags.items?.map((flag: FeatureFlag) => ({
              key: flag.key,
              name: flag.name,
              description: flag.description || '',
              kind: flag.kind || 'boolean',
              temporary: flag.temporary || false,
              maintainer: flag._maintainer?.name || null,
              tags: flag._tags || [],
              variations: flag.variations || [],
              defaults: flag.defaults || {},
              _links: flag._links || {},
              archived: flag._archived || false,
              clientSideAvailability: flag.clientSideAvailability || {},
              creationDate: flag._creationDate,
              includedInSnippet: flag.clientSideAvailability?.usingMobileKey || false,
              contexts: flag._contexts || [],
              environments: flag.environments || {}
            })) || [], null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching feature flags for project "${projectKey}": ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  });

  // Tool to get detailed information about a specific feature flag
  server.tool('getFeatureFlag', {
    projectKey: z.string().describe('The project key the feature flag belongs to'),
    flagKey: z.string().describe('The key of the feature flag to retrieve'),
  }, async ({ projectKey, flagKey }, extra) => {
    try {
      const flag = await ldRequest(`/flags/${projectKey}/${flagKey}`) as FeatureFlag;
      
      const flagData = {
        key: flag.key,
        name: flag.name,
        description: flag.description || '',
        kind: flag.kind,
        variations: flag.variations,
        tags: flag._tags || [],
        maintainer: flag._maintainer?.name || '',
        creationDate: flag._creationDate,
        version: (flag as any).version,
        defaults: flag.defaults,
        clientSideAvailability: flag.clientSideAvailability,
      };
      
      return {
        content: [
          {
            type: 'text',
            text: `Details for feature flag "${flagKey}" in project "${projectKey}":`,
          },
          {
            type: 'text',
            text: JSON.stringify(flagData, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching feature flag "${flagKey}" in project "${projectKey}": ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  });

  // Tool to get flag status across environments
  server.tool('getFeatureFlagStatus', {
    projectKey: z.string().describe('The project key the feature flag belongs to'),
    flagKey: z.string().describe('The key of the feature flag to check status for'),
    environmentKey: z.string().optional().describe('Optional: specific environment to check status for'),
  }, async ({ projectKey, flagKey, environmentKey }, extra) => {
    try {
      let endpoint = `/flag-statuses/${projectKey}/${flagKey}`;
      if (environmentKey) {
        endpoint += `/environments/${environmentKey}`;
      }
      
      const status = await ldRequest(endpoint) as FlagStatus;
      
      if (environmentKey) {
        const statusData = {
          environment: status.name,
          status: status._status || {},
          lastRequested: status._lastRequested,
          enabled: status.on,
          archived: status._archived || false,
          rules: status.rules?.length || 0,
          fallthrough: status.fallthrough,
          offVariation: status.offVariation,
          prerequisites: status.prerequisites?.length || 0,
        };
        
        return {
          content: [
            {
              type: 'text',
              text: `Status for feature flag "${flagKey}" in environment "${environmentKey}":`,
            },
            {
              type: 'text',
              text: JSON.stringify(statusData, null, 2),
            },
          ],
        };
      } else {
        const statusData = Object.entries(status.environments || {}).map(([envKey, env]) => ({
          environmentKey: envKey,
          environmentName: (env as FlagStatus).name,
          enabled: (env as FlagStatus).on,
          lastRequested: (env as FlagStatus)._lastRequested,
          status: (env as FlagStatus)._status || {},
        }));
        
        return {
          content: [
            {
              type: 'text',
              text: `Status for feature flag "${flagKey}" across all environments:`,
            },
            {
              type: 'text',
              text: JSON.stringify(statusData, null, 2),
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching status for feature flag "${flagKey}": ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  });
}
