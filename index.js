const core = require('@actions/core');
const github = require('@actions/github');
const { reportError, normalizeCapabilityName } = require('./lib/common');
const YAML = require('yaml');

async function run() {
  try {
    const { context } = github;
    let body = context.payload.issue.body;
    let org = context.payload.organization.login;
    let variables = YAML.parse(body);
    const {name, description, action} = variables;
    const adminToken = core.getInput('admin_token');
    const octokit = new github.GitHub(adminToken);

    console.log(`Parameters parsed: name - ${name}, description - ${description}, action - ${action}`)

    if(!action || action.trim().length === 0){
      await reportError(github, core, octokit, "⚠️ Validation error: The action name does not exist. Follow the template");
      return;
    }

    // Validate the name exists
    if(!name || name.trim().length === 0) {
      await reportError(github, core, octokit, "⚠️ Validation error: Missing name in the yaml config");
      return;
    }

    // Validate the capability contains a description
    if(!description || description.trim().length === 0) {
      await reportError(github, core, octokit, "⚠️ Validation error: Missing description in the yaml config");
      return;
    }

    // Validate repository to be created does not exist already
    let capabilityRepoName = normalizeCapabilityName(name);
    let repositoryExists = false;
    try {
      await octokit.repos.get({
        owner: org,
        repo: capabilityRepoName
      });
      core.debug(`The repository ${capabilityRepoName} request didn't fail which means the repo exists`);
      repositoryExists = true;
    }catch (e) {
      if (e.status === 404) {
        repositoryExists = false;
      }else {
        await reportError(github, core, octokit, "There was an error while obtaining the repository data. Try again later");
        return;
      }
    }

    core.debug(`The repository ${capabilityRepoName} exists: ${repositoryExists}`);
    if(repositoryExists){
      await reportError(github, core, octokit, `⚠️ Validation error: The repository ${capabilityRepoName} already exists`);
      return;
    }

    // Set the output to use in the rest of the actions
    core.setOutput('action', action);
    core.setOutput('name', capabilityRepoName);
    core.setOutput('description', description);
  } catch (error) {
    await reportError(github, core, octokit, error.message);
  }
}

run();
