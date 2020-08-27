# 💣 PR Landmine for GitHub
A simple, language agnostic solution for creating manual mutation tests directly in-line with a GitHub pull request

# Overview
Using Azure DevOps? See [ado-pr-landmine](https://github.com/tylermurry/ado-pr-landmine)

As a reviewer, it's important you feel comfortable with the quality of the code in a PR.
Mutation testing is a powerful way to gain confidence in the quality of the tests, but it can be difficult, time-consuming or even inappropriate to seek high-levels mutation coverage in some cases.

PR Landmines allow reviewers to strategically add mutations to the code of a PR and verify the tests will catch the issue. All while using the existing GitHub pull request interface to keep things in-line and straight-forward. 

#### Why would I use this?
* Takes seconds to implement and is language agnostic
* Great for applications that have little-to-no mutation coverage
* Perfect for applications that get their coverage from slower-running integration tests rather than unit tests
* A powerful conversation starter to educate others on the benefits of testing in real-time

#### When would I not use this?
* The solution isn't recommended for applications that have lots of unit tests and good mutation coverage.

#### See it in action
![How-It-Works](images/how-it-works.gif)

# Add the action to your workflow
Simply add the following action to your existing pull request workflow:

```yml
- name: PR Landmine
  uses: tylermurry/github-pr-landmine
  with:
    token: ${{ github.token }}
    test-command: 'npm test' # <-- Use your command here
```  

# Add a Landmine to a Pull Request
1. In a pull request, choose a file and select a single line or range of lines where you would like to create a landmine.
1. Start the comment with either the bomb emoji 💣 or `/bomb`. Either of these will signal to the task that the comment is a landmine.
1. On the next line, use the [code suggestion syntax](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/commenting-on-a-pull-request#adding-line-comments-to-a-pull-request) to inject mutated code.
1. Re-run the pull request job and the landmine thread should be annotated with the success or failure of the bomb defusal.

**Note**: Multiple landmines can be added to a pull request. Each one will be executed in sequence and pass/fail individually. 

# Task Options
| Property                 | Required | Default Value                       | Description                                                                                                                                                                                                   |
| -------------------------|----------|-------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `access-token`           | Yes      |                                     | The access token used to retrieve and update comments on the pull requests. This will typically be your github token. If so, use `${{ github.token }}`                                                                                                                                    |
| `test-command`           | Yes      |                                     | The command that is executed after each landmine is added. Ideally, this includes other static validation such as linting.                                                                                    |
| `test-command-directory` | No       |                                     | The directory to apply the test command. Useful if your tests are orchestrated in a different directory than root.                                                                                            |
| `test-command-timeout`   | No       | `60000`                             | The number of milliseconds to wait before bailing on the test command. Needs to be sufficiently high to run the test suite but low enough to catch infinite loops or runaway threads created by the mutation. |
| `auto-resolve`           | No       | `true`                              | If the bomb is defused successfully, the original pull request comment will be auto-resolved.                                                                                                                 |

# Contribution
Found an issue or see something cool that's missing? Pull requests and issues are warmly accepted!
