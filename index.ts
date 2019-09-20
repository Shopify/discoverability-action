import {getInput} from '@actions/core';
import {GitHub, context} from '@actions/github';
import {getDependencies} from './splash/treebuilder';

async function main() {
  const githubToken = getInput('githubToken');
  const octokit = new GitHub(githubToken);

  if (context.payload.pull_request) {
    const commentsList = await octokit.issues.listComments({
      owner: context.payload.pull_request.base.repo.owner.login,
      repo: context.payload.pull_request.base.repo.name,
      issue_number: context.payload.number, // eslint-disable-line babel/camelcase
    });

    let comment = commentsList.data.find((comment) => {
      console.log('NVJCFGJHVKJFJYCGVKYFCTUGJVHVJ');
      console.log(
        comment.user.type,
        comment.user.login,
        comment.body.slice(0, 22),
      );
      console.log('NVJCFGJHVKJFJYCGVKYFCTUGJVHVJ');
      return (
        comment.user.type === 'bot' &&
        comment.user.login === 'github-actions[bot]' &&
        comment.body.slice(0, 22) === 'discoverability-action'
      );
    });

    if (comment) {
      console.log('============================================');
      console.log('Updating comment with placeholder...');

      console.log(comment);
      await octokit.issues.updateComment({
        owner: context.payload.pull_request.base.repo.owner.login,
        repo: context.payload.pull_request.base.repo.name,
        comment_id: comment.id, // eslint-disable-line babel/camelcase
        body: `discoverability-action:

Building dependency graph...`,
      });
    } else {
      console.log('Posting comment...');

      const newComment = await octokit.issues.createComment({
        owner: context.payload.pull_request.base.repo.owner.login,
        repo: context.payload.pull_request.base.repo.name,
        issue_number: context.payload.number, // eslint-disable-line babel/camelcase
        body: `discoverability-action:

Building dependency graph...`,
      });

      comment = newComment.data;

      console.log('Done!');
    }

    const requestRawData = await octokit.pulls.listFiles({
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
      getInput('codebaseGlob'),
      getInput('ignoreGlob'),
      files,
    );

    console.log('============================================');
    console.log('These are the dependencies calculated:');
    console.log(dependencies);
    console.log('============================================');
    console.log('Updating comment...');

    await octokit.issues.updateComment({
      owner: context.payload.pull_request.base.repo.owner.login,
      repo: context.payload.pull_request.base.repo.name,
      comment_id: comment.id, // eslint-disable-line babel/camelcase
      body: `discoverability-action:

${JSON.stringify(dependencies, undefined, 2)}`,
    });

    console.log('Done!');
    console.log('============================================');
  }
}

main();

// getDependencies('src/**/*.tsx', 'src/**/*.test.tsx', [
//   'src/components/DatePicker/DatePicker.tsx',
// ])
//   .then((result) => {
//     console.log(result);
//     debugger;
//   })
//   .catch((err) => {
//     console.log(err);
//   });
