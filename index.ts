import {getInput} from '@actions/core';
import {getDependencies} from './splash/treebuilder';

console.log(
  getDependencies(
    getInput('codebaseGlob'),
    getInput('ignoreGlob'),
    getInput('fileGlobs').split(' '),
  ),
);
