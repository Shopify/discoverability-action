import {getInput} from '@actions/core';
import {GitHub, context} from '@actions/github';
import {getDependencies} from './splash/treebuilder';

getDependencies(
  getInput('codebaseGlob'),
  getInput('ignoreGlob'),
  getInput('fileGlobs').split(' '),
)
  .then((result) => {
    console.log(result);
  })
  .catch((err) => {
    console.log(err);
  });

const myToken = getInput('myToken');
const octokit = new GitHub(myToken);

if (context.payload.pull_request) {
  octokit.pulls
    .listFiles({
      owner: context.payload.pull_request.base.repo.owner.login,
      repo: context.payload.pull_request.base.repo.name,
      pull_number: context.payload.number, // eslint-disable-line babel/camelcase
    })
    .then((result) => {
      console.log(result);
    })
    .catch((err) => {
      console.log(err);
    });
}

console.log(JSON.stringify(context, undefined, 2));

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
