import {getDependencies} from './splash/treebuilder';

console.log(
  getDependencies(process.argv[2], process.argv[3], process.argv.slice(4)),
);
