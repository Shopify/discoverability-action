import {getInput} from '@actions/core';
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
