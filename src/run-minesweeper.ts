import fs from "fs";
const { exec } = require('child_process');

const executeOrTimeout = async (command: string, directory: string, timeout: number): Promise<any> => new Promise((resolve, reject) => {
    const process = exec(command, {cwd: directory});
    let processTimeout = setTimeout(() => {
        process.kill('SIGINT');
        reject('Test command timed out');
    }, timeout);

    process.stdout.on('data', console.log);
    process.stderr.on('data', console.log);

    process.on('exit', (code: number, signal: string) => {
        clearTimeout(processTimeout);
        if (code !== 0) reject({ code, signal })
        resolve({ code, signal });
    });
});

const executeTestCommand = async (testCommand: string, testCommandDirectory: string, testCommandTimeout: number): Promise<any> => {
    try {
        console.log('Sweeping for mines...');
        await executeOrTimeout(testCommand, testCommandDirectory, testCommandTimeout);
        return false;
    } catch (e) {
        // Timeouts are not a valid bomb-defusal failure
        if (e === 'Test command timed out') {
            console.log(`Test command failed because it exceeded timeout of ${testCommandTimeout}ms`);
            return false;
        } else {
            return true;
        }
    }
}

const createLandmine = (filePath: string, newCodeBlock: string, beginLine: number, endLine: number) => {
    console.log(`Adding landmine to ${filePath} from line ${beginLine} to ${endLine} with '${newCodeBlock}'`);

    const fileContents = fs.readFileSync(filePath || '', 'utf8');
    const fileContentsLines = fileContents.split('\n');
    const newCodeBlockLines = newCodeBlock.split('\n');

    const newFileContents = [ ...fileContentsLines.slice(0, beginLine - 1), ...newCodeBlockLines, ...fileContentsLines.slice(endLine) ];

    fs.writeFileSync(filePath, newFileContents.join('\n'), 'utf8');
}

export default async (testCommand: string, testCommandDirectory: string, testCommandTimeout: number, reviewThread: any): Promise<boolean> => {
    console.log('Running minesweeper...');

    const filePath = reviewThread.comments.nodes[0].path;
    const topComment = reviewThread.comments.nodes[0].body;
    const codeSuggestion = topComment.substring(topComment.indexOf('```suggestion\r\n') + 15, topComment.lastIndexOf('```') - 2);

    console.log('Creating backup file...');
    fs.copyFileSync(filePath, `${filePath}.backup`);

    console.log('Creating landmine...');
    createLandmine(filePath, codeSuggestion, reviewThread.originalStartLine || reviewThread.line, reviewThread.originalLine);

    const bombDefused = await executeTestCommand(testCommand, testCommandDirectory, testCommandTimeout);

    console.log('Restoring backup file...');
    fs.copyFileSync(`${filePath}.backup`, filePath);
    fs.unlinkSync(`${filePath}.backup`);

    return bombDefused;
}
