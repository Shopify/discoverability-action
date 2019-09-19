// import {getInput} from '@actions/core';
import {getDependencies} from './splash/treebuilder';

// console.log(
//   getDependencies(
//     getInput('codebaseGlob'),
//     getInput('ignoreGlob'),
//     getInput('fileGlobs').split(' '),
//   ),
// );

console.log(
  getDependencies('src/**/*.tsx', 'src/**/*.test.tsx', [
    'src/components/Button/Button.tsx',
    'src/components/Avatar/Avatar.tsx',
  ]),
);
