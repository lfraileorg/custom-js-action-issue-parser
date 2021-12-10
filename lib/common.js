async function reportError (github, core, octokit, message) {
    core.debug(`=========== Context ===========`);
    core.debug(JSON.stringify(github.context));
    core.debug(`=========== Context ===========`);

    //Set the error
    core.setFailed(message);
    await reportToUser(github, octokit, message);
}

async function reportToUser (github, octokit, message) {
    //Send the message
    const payload = github.context.payload;
    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const issueNumber = payload.issue.number;
    const params = {
        owner,
        repo,
        issue_number: issueNumber,
        body: message
    };
    await octokit.issues.createComment(params)
}

function normalizeCapabilityName(name) {
    return name.toLowerCase()
        .trim()
        .replace(/ /g, '-');
}

// Retrieve array of users from paginated response
async function getUsersFromTeam(adminOctokit, org, teamName) {
    console.log(`Retrieving members for team ${teamName}...`)
    const params = {
      org,
      team_slug: teamName,
      per_page: 100,
    };
    let teamUsers = [];
    for await (const response of adminOctokit.paginate.iterator(
      adminOctokit.teams.listMembersInOrg, 
      params
    )) {
      teamUsers = teamUsers.concat(response.data.map((item) => item.login.toLowerCase()));
    }
    return teamUsers;
}

module.exports = {
    reportError,
    reportToUser,
    normalizeCapabilityName,
    getUsersFromTeam
};