import {getInput} from '@actions/core';
import github from '@actions/github';
import {getDependencies} from './splash/treebuilder';

console.log(
  getInput('codebaseGlob'),
  getInput('ignoreGlob'),
  getInput('fileGlobs').split(' '),
);

console.log(JSON.stringify(github.context.payload, undefined, 2));

console.log(
  getDependencies(
    getInput('codebaseGlob'),
    getInput('ignoreGlob'),
    getInput('fileGlobs').split(' '),
  ),
);
