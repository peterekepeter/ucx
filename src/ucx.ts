#!/usr/bin/env node

import { DEFAULT_UCX_COMMAND, parseCliArgs, parseEnvArgs,  } from "./lib/cli";
import { SubprocessError } from "./lib/commands";
import { dispatchCommand } from "./lib/commands/dispatchCommand";
import { UnknownCommandError, UserInputError } from "./lib/commands/error";
import { red, bold } from "./lib/commands/terminal";
import { InvalidUccPath } from "./lib/commands/InvalidUccPath";

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
            console.error(red(err.message));
            console.log("Available commands:", err.knownCommands.map(c => bold(c)).join(', '));
            process.exit(1);
        }
        else if (err instanceof SubprocessError){
            console.error(red(err.message));
            process.exit(1);
        }
        else if (err instanceof UserInputError){
            console.error(red('Error: ' + err.message));
            process.exit(1);
        }
        else if (err instanceof InvalidUccPath) {
            console.error(INVALID_UCC_INFO);
            process.exit(1);
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

const INVALID_UCC_INFO = `
path to UCC must be provided either via env var ${bold('UCC_PATH')}  or cli argument ${bold('--ucc')}
`;