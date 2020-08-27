const { graphql } = require('@octokit/graphql');
import { executeTask } from './index';
import { when } from 'jest-when';
const core = require('@actions/core');
const github = require('@actions/github');
const { Octokit } = require('@octokit/rest');

jest.mock('@actions/core');
jest.mock('@actions/github');
jest.mock('@octokit/graphql');
jest.mock('@octokit/rest');

const restMock = {
    pulls: {
        createReplyForReviewComment: jest.fn(),
    },
};
(Octokit as any).mockImplementation(() => restMock);

jest.setTimeout(10000000);

describe('Integration Test', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Mock Inputs
        when(core.getInput).calledWith('token').mockReturnValueOnce('some-token');
        when(core.getInput).calledWith('test-command').mockReturnValueOnce('npm test');
        when(core.getInput).calledWith('test-command-directory').mockReturnValueOnce('./demo-app');
        when(core.getInput).calledWith('test-command-timeout').mockReturnValueOnce('5000');
        when(core.getInput).calledWith('auto-resolve').mockReturnValueOnce(undefined);
        github['context'] = {
            payload: {
                pull_request: {number: 123},
                repository: {
                    owner: {login: 'some-owner'},
                    name: 'some-repo-name'
                }
            }
        };
    })

    it('should add two landmines and catch them all', async () => {
        graphql.mockReturnValueOnce({
            repository: {
                pullRequest: {
                    reviewThreads: {
                        nodes: [{
                            id: 'MDIzOlB1bGxSZXF1ZXN0UmV2aWV3VGhyZWFkMjk4NTE0MDI4OnYy',
                            isResolved: false,
                            line: 12,
                            originalLine: 12,
                            originalStartLine: null,
                            comments: {
                                nodes: [{
                                    id: "MDI0OlB1bGxSZXF1ZXN0UmV2aWV3Q29tbWVudDQ3NzQ4NDE5Ng==",
                                    body: "💣\r\n```suggestion\r\n    return null;\r\n```",
                                    path: "demo-app/insertion-sort.js"
                                }]
                            }
                        },{
                            id: 'MDIzOlB1bGxSZXF1ZXN0UmV2aWV3VGhyZWFkMjk4NTE0MDI4OnYy',
                            isResolved: false,
                            line: 12,
                            originalLine: 12,
                            originalStartLine: null,
                            comments: {
                                nodes: [{
                                    id: "MDI0OlB1bGxSZXF1ZXN0UmV2aWV3Q29tbWVudDQ3NzQ4NDE5Ng==",
                                    body: "/bomb\r\n```suggestion\r\n    return null;\r\n```",
                                    path: "demo-app/insertion-sort.js"
                                },{
                                    id: "MDI0OlB1bGxSZXF1ZXN0UmV2aWV3Q29tbWVudDQ3NzQ4NDE5Ng==",
                                    body: "💥 Bomb not defused",
                                    path: "demo-app/insertion-sort.js"
                                }]
                            }
                        }]
                    }
                }
            }
        });

        await executeTask();

        expect(core.setFailed).not.toHaveBeenCalled();
        expect(restMock.pulls.createReplyForReviewComment).toMatchSnapshot();
        expect(graphql.mock.calls).toMatchSnapshot();
    });

    it('should add a landmine but not catch it', async () => {
        graphql.mockReturnValueOnce({
            repository: {
                pullRequest: {
                    reviewThreads: {
                        nodes: [{
                            id: 'MDIzOlB1bGxSZXF1ZXN0UmV2aWV3VGhyZWFkMjk4NTE0MDI4OnYy',
                            isResolved: false,
                            line: 3,
                            originalLine: 3,
                            originalStartLine: 2,
                            comments: {
                                nodes: [
                                    {
                                        id: "MDI0OlB1bGxSZXF1ZXN0UmV2aWV3Q29tbWVudDQ3NzQ4NDE5Ng==",
                                        body: "💣\r\n```suggestion\r\n    let length = inputArr.length; console.log('here');\r\n    for (let i = 1; i < length; i++) {\r\n```",
                                        path: "demo-app/insertion-sort.js"
                                    }
                                ]
                            }
                        }]
                    }
                }
            }
        });

        await executeTask();

        expect(core.setFailed).toHaveBeenCalledWith('There was at least bomb that was not defused.');
        expect(restMock.pulls.createReplyForReviewComment).toMatchSnapshot();
        expect(graphql.mock.calls).toMatchSnapshot();
    });

    it('should add a landmine but not catch it because the execution timed out', async () => {
        graphql.mockReturnValueOnce({
            repository: {
                pullRequest: {
                    reviewThreads: {
                        nodes: [{
                            id: 'MDIzOlB1bGxSZXF1ZXN0UmV2aWV3VGhyZWFkMjk4NTE0MDI4OnYy',
                            isResolved: false,
                            line: 8,
                            originalLine: 8,
                            originalStartLine: 7,
                            comments: {
                                nodes: [
                                    {
                                        id: "MDI0OlB1bGxSZXF1ZXN0UmV2aWV3Q29tbWVudDQ3NzQ4NDE5Ng==",
                                        body: "💣\r\n```suggestion\r\n            console.log('infinite loop!');\r\n```",
                                        path: "demo-app/insertion-sort.js"
                                    }
                                ]
                            }
                        }]
                    }
                }
            }
        });

        await executeTask();

        expect(core.setFailed).toHaveBeenCalledWith('There was at least bomb that was not defused.');
        expect(restMock.pulls.createReplyForReviewComment).toMatchSnapshot();
        expect(graphql.mock.calls).toMatchSnapshot();
    });

    it('should not find any landmines because there are no threads', async () => {
        graphql.mockReturnValueOnce({
            repository: {
                pullRequest: {
                    reviewThreads: {
                        nodes: []
                    }
                }
            }
        });

        await executeTask();

        expect(core.setFailed).not.toHaveBeenCalled();
        expect(restMock.pulls.createReplyForReviewComment).toMatchSnapshot();
        expect(graphql.mock.calls).toMatchSnapshot();
    });

    it('should not find any landmines because there are no active threads', async () => {
        graphql.mockReturnValueOnce({
            repository: {
                pullRequest: {
                    reviewThreads: {
                        nodes: [{
                            id: 'MDIzOlB1bGxSZXF1ZXN0UmV2aWV3VGhyZWFkMjk4NTE0MDI4OnYy',
                            isResolved: true,
                            line: 12,
                            originalLine: 12,
                            originalStartLine: null,
                            comments: {
                                nodes: [{
                                    id: "MDI0OlB1bGxSZXF1ZXN0UmV2aWV3Q29tbWVudDQ3NzQ4NDE5Ng==",
                                    body: "💣\r\n```suggestion\r\n    return null;\r\n```",
                                    path: "demo-app/insertion-sort.js"
                                }]
                            }
                        },{
                            id: 'MDIzOlB1bGxSZXF1ZXN0UmV2aWV3VGhyZWFkMjk4NTE0MDI4OnYy',
                            isResolved: false,
                            line: 12,
                            originalLine: 12,
                            originalStartLine: null,
                            comments: {
                                nodes: [{
                                    id: "MDI0OlB1bGxSZXF1ZXN0UmV2aWV3Q29tbWVudDQ3NzQ4NDE5Ng==",
                                    body: "/bomb\r\n```suggestion\r\n    return null;\r\n```",
                                    path: "demo-app/insertion-sort.js"
                                },{
                                    id: "MDI0OlB1bGxSZXF1ZXN0UmV2aWV3Q29tbWVudDQ3NzQ4NDE5Ng==",
                                    body: "✅ Bomb successfully defused.",
                                    path: "demo-app/insertion-sort.js"
                                }]
                            }
                        }]
                    }
                }
            }
        });

        await executeTask();

        expect(core.setFailed).not.toHaveBeenCalled();
        expect(restMock.pulls.createReplyForReviewComment).toMatchSnapshot();
        expect(graphql.mock.calls).toMatchSnapshot();
    });
});
