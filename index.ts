import {getInput} from '@actions/core';
import {context} from '@actions/github';
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
