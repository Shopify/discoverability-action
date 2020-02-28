import {getInput} from '@actions/core';
import {GitHub, context} from '@actions/github';
import bugsnag from '@bugsnag/js';
/* eslint-disable-next-line */
import {getDependencies} from '@shopify/splash';

const CommentState = {
  Loading: 'Loading',
  Error: 'Error',
  NoChanges: 'NoChanges',
  Changes: 'Changes',
};

const FIRST_QUARTILE = getInput('firstQuartile');
const THIRD_QUARTILE = getInput('thirdQuartile');

const CODEBASE_GLOB = getInput('codebaseGlob');
const IGNORE_GLOB = getInput('ignoreGlob');
const bugsnagClient = bugsnag('7dd8d9f045162b5cf94b3f90cb25b07b');

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

  let comment = commentsList.data.find((singleComment) => {
    return (
      singleComment.user.type === 'Bot' &&
      singleComment.user.login === 'github-actions[bot]' &&
      singleComment.body.slice(0, 31) === '<!-- discoverability-action -->'
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

    if (dependencies.some((dependency) => dependency.dependencies.length > 0)) {
      const formattedDependencies = formatDependencies(dependencies, context);

      if (comment) {
        console.log('Updating comment...');

        await client.issues.updateComment({
          owner: context.payload.pull_request.base.repo.owner.login,
          repo: context.payload.pull_request.base.repo.name,
          comment_id: comment.id, // eslint-disable-line babel/camelcase
          body: commentMarkup(CommentState.Changes, formattedDependencies),
        });
      } else {
        console.log('Posting comment...');

        const newComment = await client.issues.createComment({
          owner: context.payload.pull_request.base.repo.owner.login,
          repo: context.payload.pull_request.base.repo.name,
          issue_number: context.payload.number, // eslint-disable-line babel/camelcase
          body: commentMarkup(CommentState.Changes, formattedDependencies),
        });

        comment = newComment.data;
      }
    } else if (comment) {
      console.log('Updating comment...');

      await client.issues.updateComment({
        owner: context.payload.pull_request.base.repo.owner.login,
        repo: context.payload.pull_request.base.repo.name,
        comment_id: comment.id, // eslint-disable-line babel/camelcase
        body: commentMarkup(CommentState.NoChanges, undefined),
      });
    } else {
      console.log('Posting comment...');

      const newComment = await client.issues.createComment({
        owner: context.payload.pull_request.base.repo.owner.login,
        repo: context.payload.pull_request.base.repo.name,
        issue_number: context.payload.number, // eslint-disable-line babel/camelcase
        body: commentMarkup(CommentState.NoChanges, undefined),
      });

      comment = newComment.data;
    }

    console.log('Done!');
    console.log('============================================');
  } catch (error) {
    bugsnagClient.notify(error);

    if (comment) {
      console.log('Updating comment...');

      await client.issues.updateComment({
        owner: context.payload.pull_request.base.repo.owner.login,
        repo: context.payload.pull_request.base.repo.name,
        comment_id: comment.id, // eslint-disable-line babel/camelcase
        body: commentMarkup(CommentState.Error, error),
      });
    } else {
      console.log('Posting comment...');

      const newComment = await client.issues.createComment({
        owner: context.payload.pull_request.base.repo.owner.login,
        repo: context.payload.pull_request.base.repo.name,
        issue_number: context.payload.number, // eslint-disable-line babel/camelcase
        body: commentMarkup(CommentState.Error, error),
      });

      comment = newComment.data;

      console.log('Done!');
    }
    throw error;
  }
}

function getEmojiForFileName(fileName) {
  if (fileName.endsWith('.tsx') || fileName.endsWith('.ts')) {
    return '🧩';
  } else if (fileName.endsWith('.scss') || fileName.endsWith('.css')) {
    return '🎨';
  }
  return '📄';
}

function formatDependencies(dependencies, localContext) {
  const allDeps = Object.keys(
    dependencies.reduce((acc, dependency) => {
      dependency.dependencies.forEach((dep) => {
        acc[dep] = true;
      });
      return acc;
    }, {}),
  );

  let returnString;

  if (allDeps.length <= FIRST_QUARTILE) {
    returnString = `🟢 This pull request modifies <strong>${dependencies.length}</strong> files and might impact <strong>${allDeps.length}</strong> other files.

<details>
<summary><strong>Details:</strong></summary>`;
  } else if (
    allDeps.length > FIRST_QUARTILE &&
    allDeps.length <= THIRD_QUARTILE
  ) {
    returnString = `🟡 This pull request modifies <strong>${dependencies.length}</strong> files and might impact <strong>${allDeps.length}</strong> other files. This is an average splash zone for a change, remember to tophat areas that could be affected.

<details>
<summary><strong>Details:</strong></summary>`;
  } else if (allDeps.length > THIRD_QUARTILE) {
    returnString = `🔴 This pull request modifies <strong>${dependencies.length}</strong> files and might impact <strong>${allDeps.length}</strong> other files. Because this is a larger than average splash zone for a change, remember to tophat areas that could be affected.

<details>
<summary><strong>Details:</strong></summary>`;
  }

  const allDepsString = `<details>
<summary><strong>All files potentially affected (total: ${
    allDeps.length
  })</strong></summary>

${allDeps
  .reduce((accumulator, nextDependency) => {
    return `${accumulator}
- [\`${nextDependency}\`](https://github.com/${localContext.payload.pull_request.base.repo.owner.login}/${context.payload.pull_request.base.repo.name}/blob/${context.payload.pull_request.head.ref}${nextDependency})`;
  }, '')
  .trim()}
</details>`;

  const tables = dependencies.map(
    (dependency) =>
      `<details>
<summary>${getEmojiForFileName(dependency.fileName)} <code><strong>${
        dependency.fileName
      } (total: ${dependency.dependencies.length})</strong></code></summary>

#### Files potentially affected (total: ${dependency.dependencies.length})

${dependency.dependencies
  .reduce((accumulator, nextDependency) => {
    return `${accumulator}
- [\`${nextDependency}\`](https://github.com/${localContext.payload.pull_request.base.repo.owner.login}/${context.payload.pull_request.base.repo.name}/blob/${context.payload.pull_request.head.ref}${nextDependency})`;
  }, '')
  .trim()}
</details>`,
  );

  returnString = `${returnString}

${allDepsString}

${tables.join('\n\n')}
</details>`;

  return returnString;
}

function commentMarkup(state, text) {
  if (state === CommentState.Loading) {
    return `<!-- discoverability-action -->
⏳ Please wait while I’m computing the dependency graph…
This comment will automatically update in a few minutes`;
  } else if (state === CommentState.Changes) {
    return `<!-- discoverability-action -->
${text}`;
  } else if (state === CommentState.NoChanges) {
    return `<!-- discoverability-action -->
🟢 No significant changes to \`${CODEBASE_GLOB}\` were detected.`;
  } else if (state === CommentState.Error) {
    return `<!-- discoverability-action -->
❌ Something went wrong with the Discoverability Github Action. This doesn't stop you from shipping your changes.

<details>
<summary><strong>Details:</strong></summary>

<code>
${text}
</code>
</details>

We’ve been notified and will take a look.
If you need immediate help, ping @amrocha or @kaelig on Slack`;
  }
  return '';
}

main();
