import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ldRequest } from '../api.js';

interface Experiment {
  key: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'draft';
}

interface ExperimentResult {
  key: string;
  name: string;
  metrics: {
    name: string;
    value: number;
  }[];
}

export async function listExperiments(projectKey: string, environmentKey: string) {
  console.log(`Attempting to list experiments for project "${projectKey}" and environment "${environmentKey}"`);
  
  const rawResponse = await ldRequest(`/projects/${projectKey}/environments/${environmentKey}/experiments`, 'GET', undefined, true);
  console.log('Raw API Response:', rawResponse);
  
  return rawResponse;
}

export async function getExperimentDetails(projectKey: string, environmentKey: string, experimentKey: string) {
  return await ldRequest(`/projects/${projectKey}/environments/${environmentKey}/experiments/${experimentKey}`) as Experiment;
}

export async function getExperimentResults(projectKey: string, environmentKey: string, experimentKey: string) {
  return await ldRequest(`/projects/${projectKey}/environments/${environmentKey}/experiments/${experimentKey}/results`) as ExperimentResult;
}

export async function searchExperiments(projectKey: string, environmentKey: string, query: string) {
  const response = await ldRequest(`/projects/${projectKey}/environments/${environmentKey}/experiments`, 'GET', { q: query });
  return (response as { items: Experiment[] }).items;
}

export function registerExperimentTools(server: McpServer) {
  server.tool('listExperiments', 'List all experiments', {
    projectKey: z.string().describe('The project key'),
    environmentKey: z.string().describe('The environment key')
  }, async (args, extra) => {
    try {
      const { projectKey, environmentKey } = args;
      console.log(`Attempting to list experiments for project "${projectKey}" and environment "${environmentKey}"`);
      
      const rawResponse = await ldRequest(`/projects/${projectKey}/environments/${environmentKey}/experiments`, 'GET', undefined, true);
      console.log('Raw API Response:', rawResponse);
      
      return {
        content: [
          {
            type: 'text',
            text: `Raw API Response for project "${projectKey}" and environment "${environmentKey}":`,
          },
          {
            type: 'text',
            text: rawResponse,
          },
        ],
      };
    } catch (error: any) {
      console.error('Error in listExperiments:', error);
      let errorMessage = `Error listing experiments: ${error.message}`;
      if (error.stack) {
        errorMessage += `\n\nStack trace:\n${error.stack}`;
      }
      if (error.response) {
        errorMessage += `\n\nResponse data:\n${JSON.stringify(error.response.data, null, 2)}`;
      }
      return {
        content: [
          {
            type: 'text',
            text: errorMessage,
          },
        ],
      };
    }
  });

  server.tool('getExperimentDetails', 'Get details of a specific experiment', {
    projectKey: z.string().describe('The project key'),
    environmentKey: z.string().describe('The environment key'),
    experimentKey: z.string().describe('The experiment key')
  }, async (args, extra) => {
    try {
      const { projectKey, environmentKey, experimentKey } = args;
      const experiment = await ldRequest(`/projects/${projectKey}/environments/${environmentKey}/experiments/${experimentKey}`) as Experiment;
      return {
        content: [
          {
            type: 'text',
            text: `Details for experiment ${experimentKey} in project "${projectKey}" and environment "${environmentKey}":`,
          },
          {
            type: 'text',
            text: JSON.stringify(experiment, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error getting experiment details for ${args.experimentKey}: ${error.message}`,
          },
        ],
      };
    }
  });

  server.tool('getExperimentResults', 'Get results of a specific experiment', {
    projectKey: z.string().describe('The project key'),
    environmentKey: z.string().describe('The environment key'),
    experimentKey: z.string().describe('The experiment key')
  }, async (args, extra) => {
    try {
      const { projectKey, environmentKey, experimentKey } = args;
      const results = await ldRequest(`/projects/${projectKey}/environments/${environmentKey}/experiments/${experimentKey}/results`) as ExperimentResult;
      return {
        content: [
          {
            type: 'text',
            text: `Results for experiment ${experimentKey} in project "${projectKey}" and environment "${environmentKey}":`,
          },
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error getting experiment results for ${args.experimentKey}: ${error.message}`,
          },
        ],
      };
    }
  });

  server.tool('searchExperiments', 'Search for experiments', {
    projectKey: z.string().describe('The project key'),
    environmentKey: z.string().describe('The environment key'),
    query: z.string().describe('The search query')
  }, async (args, extra) => {
    try {
      const { projectKey, environmentKey, query } = args;
      const response = await ldRequest(`/projects/${projectKey}/environments/${environmentKey}/experiments`, 'GET', { q: query });
      const experiments = (response as { items: Experiment[] }).items;
      return {
        content: [
          {
            type: 'text',
            text: `Found ${experiments.length} experiments matching "${query}" in project "${projectKey}" and environment "${environmentKey}".`,
          },
          {
            type: 'text',
            text: JSON.stringify(experiments, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error searching experiments: ${error.message}`,
          },
        ],
      };
    }
  });
}