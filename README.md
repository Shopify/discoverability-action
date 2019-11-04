# Discoverability action

> Adds a comment to a pull request with areas of your code to test


## How to use

Since this is a JavaScript GitHub Action, the code in this repository gets executed directly without installed dependencies. Because of that, contributors need to run a build to ensure that their changes are reflected in the output of the action.

There is a pre-commit hook in place that runs the build, but there are cases where this hook doesn't run (for example, when using the GitHub web interface to edit files). In those cases, remember to run `yarn run build` before creating a new release.

## Contributing

To contribute to this project create a fork and clone it locally. We accept contributions in the form of pull requests and issues. Follow the [How to use](#how-to-use) instructions to get started. When contributing it is necessary to follow our [code of conduct](CODE_OF_CONDUCT.md).
