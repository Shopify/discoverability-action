# `splash` (beta)

`splash` is utilities library that helps with parsing and building a dependency graph of a Shopify JS project

It is used by consuming projects to identify dependencies and aid in manual testing.

## Types

### Dependencies

```ts
{
  fileName: string;
  dependencies: string[];
}[];
```

## API

### getDependencies(codebaseGlob: string, ignoreGlob: string, fileGlobs: string[]): Promise\<Dependencies\>

This is the main function of the library. It will build a dependency graph for all files within the `codebaseGlob`, ignoring the files in `ignoreGlob`, and then build the dependency tree for all files in `fileGlobs`. It returns a promise that returns an array of objects containing the dependencies for each of the files in `fileGlobs`.

`codebaseGlob: string`: A glob for the codebase that you want to build the dependency graph for. Example: `src/**/*.tsx`

`ignoreGlob: string`: A glob for the codebase that you want to build the dependency graph for. Example `src/**/test/*`

`fileGlobs: string[]`: A list of globs for all the files to build the dependency tree for. Example: `['src/Button/Button.tsx', 'src/List/List.tsx']`

### getGitStagedFiles(scope: string): Promise<string[]>

This is a helper function to run Splash locally. It runs `git status` and outputs a list of files modified. Call it, and use its output as the `fileGlobs` input for the `getDependencies` function.

`scope: string`: A filepath to filter filenames. For example, if the scope is `src/` then only files starting with `src/` would be included in the output. This means the file `.eslintrc` would be filtered from the output. Example: `src/`
