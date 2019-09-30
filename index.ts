import {getInput} from '@actions/core';
import {GitHub, context} from '@actions/github';
import {getDependencies, Dependencies} from './splash/treebuilder';

enum CommentState {
  Loading,
  Error,
  NoChanges,
  Changes,
}

const CODEBASE_GLOB = getInput('codebaseGlob');
const IGNORE_GLOB = getInput('ignoreGlob');

async function main() {
  if (!context.payload.pull_request) {
    return;
  }

  const githubToken = getInput('githubToken');
  const client = new GitHub(githubToken);

  const commentsList = await client.issues.listComments({
    owner: context.payload.pull_request.base.repo.owner.login,
    repo: context.payload.pull_request.base.repo.name,
    issue_number: context.payload.number, // eslint-disable-line babel/camelcase
  });

  let comment = commentsList.data.find((comment) => {
    return (
      comment.user.type === 'Bot' &&
      comment.user.login === 'github-actions[bot]' &&
      comment.body.slice(0, 31) === '<!-- discoverability-action -->'
    );
  });

  if (comment) {
    console.log('============================================');
    console.log('Updating comment with placeholder...');

    await client.issues.updateComment({
      owner: context.payload.pull_request.base.repo.owner.login,
      repo: context.payload.pull_request.base.repo.name,
      comment_id: comment.id, // eslint-disable-line babel/camelcase
      body: commentMarkup(CommentState.Loading, undefined),
    });
  } else {
    console.log('Posting comment...');

    const newComment = await client.issues.createComment({
      owner: context.payload.pull_request.base.repo.owner.login,
      repo: context.payload.pull_request.base.repo.name,
      issue_number: context.payload.number, // eslint-disable-line babel/camelcase
      body: commentMarkup(CommentState.Loading, undefined),
    });

    comment = newComment.data;

    console.log('Done!');
  }

  try {
    const requestRawData = await client.pulls.listFiles({
      owner: context.payload.pull_request.base.repo.owner.login,
      repo: context.payload.pull_request.base.repo.name,
      pull_number: context.payload.number, // eslint-disable-line babel/camelcase
    });

    const files = requestRawData.data.map((datum) => datum.filename);

    console.log('============================================');
    console.log(
      'These are the files for which the splash zone is being calculated:',
    );
    console.log(files);
    console.log('============================================');

    const dependencies = await getDependencies(
      CODEBASE_GLOB,
      IGNORE_GLOB,
      files,
    );

    console.log('============================================');
    console.log('These are the dependencies calculated:');
    console.log(dependencies);
    console.log('============================================');
    console.log('Updating comment...');

    if (dependencies.some((dependency) => dependency.dependencies.length > 0)) {
      const formattedDependencies = formatDependencies(dependencies, context);

      await client.issues.updateComment({
        owner: context.payload.pull_request.base.repo.owner.login,
        repo: context.payload.pull_request.base.repo.name,
        comment_id: comment.id, // eslint-disable-line babel/camelcase
        body: commentMarkup(CommentState.Changes, formattedDependencies),
      });
    } else {
      await client.issues.updateComment({
        owner: context.payload.pull_request.base.repo.owner.login,
        repo: context.payload.pull_request.base.repo.name,
        comment_id: comment.id, // eslint-disable-line babel/camelcase
        body: commentMarkup(CommentState.NoChanges, undefined),
      });
    }

    console.log('Done!');
    console.log('============================================');
  } catch (error) {
    await client.issues.updateComment({
      owner: context.payload.pull_request.base.repo.owner.login,
      repo: context.payload.pull_request.base.repo.name,
      comment_id: comment.id, // eslint-disable-line babel/camelcase
      body: commentMarkup(CommentState.Error, error),
    });
    throw error;
  }
}

function formatDependencies(dependencies: Dependencies, context: any) {
  let returnString = `<table><tbody>
<tr><th align="left">Files modified</th><td>${dependencies.length}</td></tr>
<tr><th align="left">Files potentially affected</th><td>${dependencies.reduce(
    (acc, next) => acc + next.dependencies.length,
    0,
  )}</td></tr>
</tbody></table>

### Details`;

  const allDeps = Object.keys(
    dependencies.reduce((acc: Record<string, boolean>, dependency) => {
      dependency.dependencies.forEach((dep) => {
        acc[dep] = true;
      });
      return acc;
    }, {}),
  );

  const allDepsString = `<details>
<summary><strong>All files potentially affected:</strong></summary>

${allDeps
  .reduce((accumulator, nextDependency) => {
    return `${accumulator}
- [\`${nextDependency}\`](https://github.com/${context.payload.pull_request.base.repo.owner.login}/${context.payload.pull_request.base.repo.name}/blob/${context.payload.pull_request.head.ref}${nextDependency})`;
  }, '')
  .trim()}
</details>`;

  const tables = dependencies.map(
    (dependency) =>
      `<details>
<summary>🧩 <code><strong>${dependency.fileName} (total: ${
        allDeps.length
      })</strong></code> (${dependency.dependencies.length})</summary>

#### Files potentially affected (total: ${dependency.dependencies.length})

${dependency.dependencies
  .reduce((accumulator, nextDependency) => {
    return `${accumulator}
- [\`${nextDependency}\`](https://github.com/${context.payload.pull_request.base.repo.owner.login}/${context.payload.pull_request.base.repo.name}/blob/${context.payload.pull_request.head.ref}${nextDependency})`;
  }, '')
  .trim()}
</details>`,
  );

  returnString = `${returnString}

${allDepsString}

${tables.join('\n\n')}`;

  return returnString;
}

function commentMarkup(state: CommentState, text: string | undefined) {
  if (state === CommentState.Loading) {
    return `<!-- discoverability-action -->
# Loading

💦 Potential splash zone of changes introduced to \`${CODEBASE_GLOB}\` in this pull request:

⏳ Please wait while I’m computing the dependency graph…

---

This comment automatically updates as changes are made to this pull request.
Feedback, troubleshooting: open an issue or reach out on Slack in [#polaris-tooling](https://shopify.slack.com/messages/CCNUS0FML).
`;
  } else if (state === CommentState.Changes) {
    return `<!-- discoverability-action -->
# Results

💦 Potential splash zone of changes introduced to \`${CODEBASE_GLOB}\` in this pull request:

${text}

---

This comment automatically updates as changes are made to this pull request.
Feedback, troubleshooting: open an issue or reach out on Slack in [#polaris-tooling](https://shopify.slack.com/messages/CCNUS0FML).`;
  } else if (state === CommentState.NoChanges) {
    return `<!-- discoverability-action -->
# No changes

💦 Potential splash zone of changes introduced to \`${CODEBASE_GLOB}\` in this pull request:

No significant changes to \`${CODEBASE_GLOB}\` were detected.

---

This comment automatically updates as changes are made to this pull request.
Feedback, troubleshooting: open an issue or reach out on Slack in [#polaris-tooling](https://shopify.slack.com/messages/CCNUS0FML).`;
  } else if (state === CommentState.Error) {
    return `<!-- discoverability-action -->
# Error

💦 Potential splash zone of changes introduced to \`${CODEBASE_GLOB}\` in this pull request:

❌ Something fishy happened. We’re on it!

cc @amrocha @kaelig

<details>
<summary>Error message:</summary>

<code>
${text}
</code>
</details>

---

This comment automatically updates as changes are made to this pull request.
Feedback, troubleshooting: open an issue or reach out on Slack in [#polaris-tooling](https://shopify.slack.com/messages/CCNUS0FML).`;
  }
  return '';
}

main();
