import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {getInput} from '@actions/core';
import {GitHub, context} from '@actions/github';
import {getDependencies, Dependencies} from './splash/treebuilder';

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
      comment.body.slice(0, 22) === 'discoverability-action'
    );
  });

  if (comment) {
    console.log('============================================');
    console.log('Updating comment with placeholder...');

    await client.issues.updateComment({
      owner: context.payload.pull_request.base.repo.owner.login,
      repo: context.payload.pull_request.base.repo.name,
      comment_id: comment.id, // eslint-disable-line babel/camelcase
      body: commentMarkup(undefined),
    });
  } else {
    console.log('Posting comment...');

    const newComment = await client.issues.createComment({
      owner: context.payload.pull_request.base.repo.owner.login,
      repo: context.payload.pull_request.base.repo.name,
      issue_number: context.payload.number, // eslint-disable-line babel/camelcase
      body: commentMarkup(undefined),
    });

    comment = newComment.data;

    console.log('Done!');
  }

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
    getInput('codebaseGlob'),
    getInput('ignoreGlob'),
    files,
  );

  console.log('============================================');
  console.log('These are the dependencies calculated:');
  console.log(dependencies);
  console.log('============================================');
  console.log('Updating comment...');

  await client.issues.updateComment({
    owner: context.payload.pull_request.base.repo.owner.login,
    repo: context.payload.pull_request.base.repo.name,
    comment_id: comment.id, // eslint-disable-line babel/camelcase
    body: commentMarkup(dependencies),
  });

  console.log('Done!');
  console.log('============================================');
}

function commentMarkup(dependencies: Dependencies | undefined) {
  const dependencyMarkup = dependencies
    ? JSON.stringify(dependencies, undefined, 2)
    : 'Building dependency graph...';

  return renderToStaticMarkup(
    <>
      discoverability-action:
      <h1>Test0ng haha</h1>
      {dependencyMarkup}
    </>,
  );
}

main();
