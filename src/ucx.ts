#!/usr/bin/env node

import { DEFAULT_UCX_COMMAND, parseCliArgs, parseEnvArgs,  } from "./lib/cli";
import { SubprocessError } from "./lib/commands";
import { dispatchCommand } from "./lib/commands/dispatchCommand";
import { UnknownCommandError } from "./lib/commands/UnknownCommandError";
import chalk = require('chalk');

setTimeout(main, 0);

async function main(){
    try
    {
        const command = parseUserInput();
        if (!command.command) {
            printUsage();
        }
        else {
            await dispatchCommand(command);
        }
    }
    catch (err) {
        if (err instanceof UnknownCommandError) {
            console.error(chalk.red(err.message));
            console.log("Available commands:", err.knownCommands.map(c => chalk.bold(c)).join(', '));
        }
        else if (err instanceof SubprocessError){
            console.error(chalk.red(err.message));
        }
        else {
            throw err;
        }
    }
};

function parseUserInput(){
    try {
        return {
            ...DEFAULT_UCX_COMMAND,
            ...parseEnvArgs(process.env),
            ...parseCliArgs(process.argv),
        };
    }
    catch (error) {
        printUsage();
        throw error;
    }
}

function printUsage(){
    console.log(USAGE_INFO);
}

const USAGE_INFO = `
ucx command [--option optionValue] path1 path2 path3 ...
`;