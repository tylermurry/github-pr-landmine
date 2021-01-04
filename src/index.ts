import BombReport from "./bomb-report";

const core = require('@actions/core');
const github = require('@actions/github');
import PullRequestService from './pull-request-service';
import runMinesweeper from './run-minesweeper';

const outInvalidThreads = (thread): boolean => {
    // Ensure the comment is a "bomb"
    const topComment: string = thread.comments.nodes[0].body || '';
    if (!(topComment.includes('/bomb') || topComment.includes('💣'))) return false;

    // Ensure the top comment includes a code suggestion
    if (!topComment.includes('```suggestion')) return false;

    // Ensure the thread isn't already marked as "passed"
    if (thread.comments.nodes.find(comment => comment.body?.includes('✅'))) return false;

    return true;
};

export const executeTask = async () => {
    try {
        const token = core.getInput('token');
        const testCommand = core.getInput('test-command');
        const testCommandDirectory = core.getInput('test-command-directory');
        const testCommandTimeout = core.getInput('test-command-timeout');
        const autoResolveRaw = core.getInput('auto-resolve');
        const autoResolve = autoResolveRaw ? `${autoResolveRaw}`.toUpperCase() === 'TRUE' : true;
        const pullRequestNumber = github.context.payload.pull_request.number;
        const owner = github.context.payload.repository.owner.login;
        const repoName = github.context.payload.repository.name;

        if (!token) throw Error('accessToken must be provided');
        if (!testCommand) throw Error('testCommand must be provided');

        const pullRequestService = new PullRequestService(token, owner, repoName);

        const threads = await pullRequestService.getActiveThreads(pullRequestNumber);
        console.log(`All threads: ${JSON.stringify(threads, null, 2)}`);

        const validThreads = threads.filter(outInvalidThreads);
        console.log(`Valid threads: ${JSON.stringify(validThreads, null, 2)}`);

        const bombReport = new BombReport();
        let atLeastOneFailure = false;

        for (const thread of validThreads) {
            console.log(JSON.stringify(thread, null, 2));

            const bombDefused = await runMinesweeper(testCommand, testCommandDirectory, testCommandTimeout, thread);
            bombReport.pushBombOutcome(thread, bombDefused);

            if (bombDefused) {
                await pullRequestService.replyToCommentToThread(pullRequestNumber, thread.id, thread.comments.nodes[0].id, '✅ Successfully defused bomb', autoResolve);
            } else {
                atLeastOneFailure = true;
                await pullRequestService.replyToCommentToThread(pullRequestNumber, thread.id, thread.comments.nodes[0].id, '💥 Bomb not defused. Please adjust your test to catch the error', false);
            }
        }

        console.log(bombReport.generateReport());

        if (atLeastOneFailure) {
            throw Error('There was at least one bomb that was not defused.')
        }
    }
    catch (err) {
        console.log(err);
        core.setFailed(err.message);
    }
}

executeTask();
