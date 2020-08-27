const { graphql } = require('@octokit/graphql');
const { Octokit } = require('@octokit/rest');

export default class PullRequestService {
    private readonly token: string;
    private readonly owner: string;
    private readonly repoName: string;

    public constructor(token: string, owner: string, repoName: string) {
        this.token = token;
        this.owner = owner;
        this.repoName = repoName;
    }

    public async getActiveThreads(pullRequestNumber: number): Promise<any> {
        console.log(`Getting active threads for PR #${pullRequestNumber}...`);
        const threads = await graphql(`
        {
          repository(name: "${this.repoName}", owner: "${this.owner}") {
            pullRequest(number: ${pullRequestNumber}) {
              reviewThreads(last: 100) {
                nodes {
                  id
                  isResolved
                  line
                  originalLine
                  originalStartLine
                  comments(last: 100) {
                    nodes {
                      id
                      body
                      path
                    }
                  }
                }
              }
            }
          }
        }`, { headers: { authorization: `token ${this.token}` } });

        return threads.repository.pullRequest.reviewThreads.nodes
            .filter(thread => !thread.isResolved);
    }

    public async replyToCommentToThread(pullRequestNumber: number, parentThreadId: string, threadId: string, comment: string, autoResolve: boolean): Promise<void> {
        const api = new Octokit({ auth: this.token});
        const decodedThreadId = new Buffer(threadId, 'base64').toString('utf8');
        const commentId = decodedThreadId.substring(decodedThreadId.lastIndexOf('PullRequestReviewComment') + 24);

        // Can't use the GraphQL api because of a strange permission issue. Remove this when that's fixed
        await api.pulls.createReplyForReviewComment({
            owner: this.owner,
            repo: this.repoName,
            pull_number: pullRequestNumber,
            comment_id: commentId,
            body: comment
        });

        if (autoResolve) {
            await graphql(`
              mutation {
                  resolveReviewThread(input: {threadId: "${ parentThreadId }"}) {
                    clientMutationId
                  }
              }
            `, { headers: { authorization: `token ${this.token}` } });
        }
    }
}
