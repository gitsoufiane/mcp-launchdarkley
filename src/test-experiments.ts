import { listExperiments, getExperimentDetails, getExperimentResults, searchExperiments } from './tools/experiments.js';

const projectKey = 'default';
const environmentKey = 'production';

async function testExperiments() {
  try {
    console.log('Listing experiments:');
    const experiments = await listExperiments(projectKey, environmentKey);
    console.log(experiments);

    // Assuming experiments is an array of Experiment objects
    if (Array.isArray(experiments) && experiments.length > 0) {
      const testKey = experiments[0].key;

      console.log(`Getting details for experiment ${testKey}:`);
      const details = await getExperimentDetails(projectKey, environmentKey, testKey);
      console.log(details);

      console.log(`Getting results for experiment ${testKey}:`);
      const results = await getExperimentResults(projectKey, environmentKey, testKey);
      console.log(results);
    } else {
      console.log('No experiments found or unexpected response format.');
    }

    console.log('Searching experiments:');
    const searchResults = await searchExperiments(projectKey, environmentKey, 'test');
    console.log(searchResults);
  } catch (error) {
    console.error('Error:', error);
  }
}

testExperiments();