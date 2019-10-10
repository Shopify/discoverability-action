"use strict";

var _core = require("@actions/core");

var _github = require("@actions/github");

var _treebuilder = require("./splash/treebuilder");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var CommentState;

(function (CommentState) {
  CommentState[CommentState["Loading"] = 0] = "Loading";
  CommentState[CommentState["Error"] = 1] = "Error";
  CommentState[CommentState["NoChanges"] = 2] = "NoChanges";
  CommentState[CommentState["Changes"] = 3] = "Changes";
})(CommentState || (CommentState = {}));

var CODEBASE_GLOB = (0, _core.getInput)('codebaseGlob');
var IGNORE_GLOB = (0, _core.getInput)('ignoreGlob');

function main() {
  return _main.apply(this, arguments);
}

function _main() {
  _main = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    var githubToken, client, commentsList, comment, newComment, requestRawData, files, dependencies, formattedDependencies;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (_github.context.payload.pull_request) {
              _context.next = 2;
              break;
            }

            return _context.abrupt("return");

          case 2:
            githubToken = (0, _core.getInput)('githubToken');
            client = new _github.GitHub(githubToken);
            _context.next = 6;
            return client.issues.listComments({
              owner: _github.context.payload.pull_request.base.repo.owner.login,
              repo: _github.context.payload.pull_request.base.repo.name,
              issue_number: _github.context.payload.number // eslint-disable-line babel/camelcase

            });

          case 6:
            commentsList = _context.sent;
            comment = commentsList.data.find(function (comment) {
              return comment.user.type === 'Bot' && comment.user.login === 'github-actions[bot]' && comment.body.slice(0, 31) === '<!-- discoverability-action -->';
            });

            if (!comment) {
              _context.next = 15;
              break;
            }

            console.log('============================================');
            console.log('Updating comment with placeholder...');
            _context.next = 13;
            return client.issues.updateComment({
              owner: _github.context.payload.pull_request.base.repo.owner.login,
              repo: _github.context.payload.pull_request.base.repo.name,
              comment_id: comment.id,
              // eslint-disable-line babel/camelcase
              body: commentMarkup(CommentState.Loading, undefined)
            });

          case 13:
            _context.next = 21;
            break;

          case 15:
            console.log('Posting comment...');
            _context.next = 18;
            return client.issues.createComment({
              owner: _github.context.payload.pull_request.base.repo.owner.login,
              repo: _github.context.payload.pull_request.base.repo.name,
              issue_number: _github.context.payload.number,
              // eslint-disable-line babel/camelcase
              body: commentMarkup(CommentState.Loading, undefined)
            });

          case 18:
            newComment = _context.sent;
            comment = newComment.data;
            console.log('Done!');

          case 21:
            _context.prev = 21;
            _context.next = 24;
            return client.pulls.listFiles({
              owner: _github.context.payload.pull_request.base.repo.owner.login,
              repo: _github.context.payload.pull_request.base.repo.name,
              pull_number: _github.context.payload.number // eslint-disable-line babel/camelcase

            });

          case 24:
            requestRawData = _context.sent;
            files = requestRawData.data.map(function (datum) {
              return datum.filename;
            });
            console.log('============================================');
            console.log('These are the files for which the splash zone is being calculated:');
            console.log(files);
            console.log('============================================');
            _context.next = 32;
            return (0, _treebuilder.getDependencies)(CODEBASE_GLOB, IGNORE_GLOB, files);

          case 32:
            dependencies = _context.sent;
            console.log('============================================');
            console.log('These are the dependencies calculated:');
            console.log(dependencies);
            console.log('============================================');
            console.log('Updating comment...');

            if (!dependencies.some(function (dependency) {
              return dependency.dependencies.length > 0;
            })) {
              _context.next = 44;
              break;
            }

            formattedDependencies = formatDependencies(dependencies, _github.context);
            _context.next = 42;
            return client.issues.updateComment({
              owner: _github.context.payload.pull_request.base.repo.owner.login,
              repo: _github.context.payload.pull_request.base.repo.name,
              comment_id: comment.id,
              // eslint-disable-line babel/camelcase
              body: commentMarkup(CommentState.Changes, formattedDependencies)
            });

          case 42:
            _context.next = 46;
            break;

          case 44:
            _context.next = 46;
            return client.issues.updateComment({
              owner: _github.context.payload.pull_request.base.repo.owner.login,
              repo: _github.context.payload.pull_request.base.repo.name,
              comment_id: comment.id,
              // eslint-disable-line babel/camelcase
              body: commentMarkup(CommentState.NoChanges, undefined)
            });

          case 46:
            console.log('Done!');
            console.log('============================================');
            _context.next = 55;
            break;

          case 50:
            _context.prev = 50;
            _context.t0 = _context["catch"](21);
            _context.next = 54;
            return client.issues.updateComment({
              owner: _github.context.payload.pull_request.base.repo.owner.login,
              repo: _github.context.payload.pull_request.base.repo.name,
              comment_id: comment.id,
              // eslint-disable-line babel/camelcase
              body: commentMarkup(CommentState.Error, _context.t0)
            });

          case 54:
            throw _context.t0;

          case 55:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[21, 50]]);
  }));
  return _main.apply(this, arguments);
}

function getEmojiForFileName(fileName) {
  if (fileName.endsWith('.tsx') || fileName.endsWith('.ts')) {
    return '🧩';
  } else if (fileName.endsWith('.scss') || fileName.endsWith('.css')) {
    return '🎨';
  }

  return '📄';
}

function formatDependencies(dependencies, context) {
  var allDeps = Object.keys(dependencies.reduce(function (acc, dependency) {
    dependency.dependencies.forEach(function (dep) {
      acc[dep] = true;
    });
    return acc;
  }, {}));
  var returnString = "<table><tbody>\n<tr><th align=\"left\">Files modified</th><td>".concat(dependencies.length, "</td></tr>\n<tr><th align=\"left\">Files potentially affected</th><td>").concat(allDeps.length, "</td></tr>\n</tbody></table>\n\n### Details");
  var allDepsString = "<details>\n<summary><strong>All files potentially affected (total: ".concat(allDeps.length, ")</strong></summary>\n\n").concat(allDeps.reduce(function (accumulator, nextDependency) {
    return "".concat(accumulator, "\n- [`").concat(nextDependency, "`](https://github.com/").concat(context.payload.pull_request.base.repo.owner.login, "/").concat(context.payload.pull_request.base.repo.name, "/blob/").concat(context.payload.pull_request.head.ref).concat(nextDependency, ")");
  }, '').trim(), "\n</details>");
  var tables = dependencies.map(function (dependency) {
    return "<details>\n<summary>".concat(getEmojiForFileName(dependency.fileName), " <code><strong>").concat(dependency.fileName, " (total: ").concat(dependency.dependencies.length, ")</strong></code></summary>\n\n#### Files potentially affected (total: ").concat(dependency.dependencies.length, ")\n\n").concat(dependency.dependencies.reduce(function (accumulator, nextDependency) {
      return "".concat(accumulator, "\n- [`").concat(nextDependency, "`](https://github.com/").concat(context.payload.pull_request.base.repo.owner.login, "/").concat(context.payload.pull_request.base.repo.name, "/blob/").concat(context.payload.pull_request.head.ref).concat(nextDependency, ")");
    }, '').trim(), "\n</details>");
  });
  returnString = "".concat(returnString, "\n\n").concat(allDepsString, "\n\n").concat(tables.join('\n\n'));
  return returnString;
}

function commentMarkup(state, text) {
  if (state === CommentState.Loading) {
    return "<!-- discoverability-action -->\n\uD83D\uDCA6 Potential splash zone of changes introduced to `".concat(CODEBASE_GLOB, "` in this pull request:\n\n\u23F3 Please wait while I\u2019m computing the dependency graph\u2026\n\n---\n\nThis comment automatically updates as changes are made to this pull request.\nFeedback, troubleshooting: open an issue or reach out on Slack in [#polaris-tooling](https://shopify.slack.com/messages/CCNUS0FML).\n");
  } else if (state === CommentState.Changes) {
    return "<!-- discoverability-action -->\n\uD83D\uDCA6 Potential splash zone of changes introduced to `".concat(CODEBASE_GLOB, "` in this pull request:\n\n").concat(text, "\n\n---\n\nThis comment automatically updates as changes are made to this pull request.\nFeedback, troubleshooting: open an issue or reach out on Slack in [#polaris-tooling](https://shopify.slack.com/messages/CCNUS0FML).");
  } else if (state === CommentState.NoChanges) {
    return "<!-- discoverability-action -->\n\uD83D\uDCA6 Potential splash zone of changes introduced to `".concat(CODEBASE_GLOB, "` in this pull request:\n\nNo significant changes to `").concat(CODEBASE_GLOB, "` were detected.\n\n---\n\nThis comment automatically updates as changes are made to this pull request.\nFeedback, troubleshooting: open an issue or reach out on Slack in [#polaris-tooling](https://shopify.slack.com/messages/CCNUS0FML).");
  } else if (state === CommentState.Error) {
    return "<!-- discoverability-action -->\n\uD83D\uDCA6 Potential splash zone of changes introduced to `".concat(CODEBASE_GLOB, "` in this pull request:\n\n\u274C Something fishy happened. We\u2019re on it!\n\ncc @amrocha @kaelig\n\n<details>\n<summary>Error message:</summary>\n\n<code>\n").concat(text, "\n</code>\n</details>\n\n---\n\nThis comment automatically updates as changes are made to this pull request.\nFeedback, troubleshooting: open an issue or reach out on Slack in [#polaris-tooling](https://shopify.slack.com/messages/CCNUS0FML).");
  }

  return '';
}

process.argv.forEach(function (val, index) {
  console.log("".concat(index, ": ").concat(val));
});
main();