import path from 'path';
import * as ts from 'typescript';
import glob from 'glob';
import cmd from 'node-cmd';

type Node = {
  fileName: string;
  dependsOn: Node[];
  dependedOnBy: Node[];
};

type GraphType = {
  [name: string]: Node;
};

export type Dependencies = {
  fileName: string;
  dependencies: string[];
}[];

const graph: GraphType = {};

function compile(fileNames: string[], options: ts.CompilerOptions): void {
  const program = ts.createProgram(fileNames, options);

  fileNames.map((fileName) => {
    if (!graph[path.resolve(fileName)]) {
      const ast: any = program.getSourceFile(fileName);
      recurse({
        fileName: path.resolve(ast.originalFileName),
        dependsOn: [],
        dependedOnBy: [],
      });
    }
  });

  function recurse(node: Node) {
    const ast: any = program.getSourceFile(node.fileName);

    if (ast && ast.resolvedModules) {
      const dependencies = Array.from(ast.resolvedModules.entries())
        .map(([key, module]: any) => {
          if (!module) {
            return recurse({
              fileName: path.resolve(
                ast.originalFileName.replace(/(.*\/)(.*)/, `$1${key}`),
              ),
              dependsOn: [],
              dependedOnBy: [node],
            });
          }

          if (module.isExternalLibraryImport) {
            return undefined;
          }

          const moduleFileName = module.resolvedFileName;

          let newNode;
          if (graph[path.resolve(moduleFileName)]) {
            newNode = graph[path.resolve(moduleFileName)];
            newNode.dependedOnBy.push(node);
          } else {
            newNode = recurse({
              fileName: moduleFileName,
              dependsOn: [],
              dependedOnBy: [node],
            });
          }
          return newNode;
        })
        .filter((node) => node);

      node.dependsOn = dependencies as Node[];
    }

    graph[path.resolve(node.fileName)] = node;
    return node;
  }
}

function findDependencies(fileName: string) {
  const dependencies: Record<string, any> = {};
  recurse(graph[path.resolve(fileName)]);

  function recurse(node: Node) {
    if (node && node.dependedOnBy) {
      node.dependedOnBy.forEach((dependency) => {
        dependencies[dependency.fileName] = 1;
        recurse(dependency);
      });
    }
  }

  return Object.keys(dependencies).filter(
    (dependency) => !/(components\/)(\w*\/)?(index.ts)/.test(dependency),
  );
}

export function getGitStagedFiles(scope = '') {
  return new Promise((resolve, reject) => {
    cmd.get('git status --porcelain', (err: any, data: string) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(
        data
          .split('\n')
          .filter(
            (datum) =>
              ['M', 'A'].includes(datum[0]) || ['M', 'A'].includes(datum[1]),
          )
          .map((datum) => datum.slice(3))
          .filter((filepath) => filepath.startsWith(scope)),
      );
    });
  });
}

export async function getDependencies(
  codebaseGlob: string,
  ignoreGlob: string,
  fileGlobs: string[],
): Promise<Dependencies> {
  const codebase = glob.sync(codebaseGlob, {
    ignore: ignoreGlob,
  });

  compile(codebase, {
    noEmitOnError: true,
    noImplicitAny: true,
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS,
  });

  const rawGitRootDirectory = await new Promise<string>((resolve, reject) => {
    cmd.get(
      'git rev-parse --show-toplevel',
      (err: any, gitRootDirectory: string) => {
        if (err) {
          reject(err);
        }
        resolve(gitRootDirectory);
      },
    );
  });
  const gitRootDirectory = rawGitRootDirectory.trim();

  const dependencies = fileGlobs
    .map((fileGlob) => glob.sync(fileGlob))
    .reduce((accumulator, current) => [...accumulator, ...current], [])
    .map(findDependencies)
    .map((dependencyList) =>
      dependencyList.map((dependency) => dependency.split(gitRootDirectory)[1]),
    );

  return fileGlobs.map((fileGlob, index) => ({
    fileName: fileGlob,
    dependencies: dependencies[index] || [],
  }));
}
