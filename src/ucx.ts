#!/usr/bin/env node

import { DEFAULT_UCX_COMMAND, parseCliArgs, parseEnvArgs,  } from "./lib/cli";
import { SubprocessError } from "./lib/commands";
import { dispatchCommand, knownCommands } from "./lib/commands/dispatchCommand";
import { UnknownCommandError, UserInputError } from "./lib/commands/error";
import { red, bold } from "./lib/commands/terminal";
import { InvalidUccPath } from "./lib/commands/InvalidUccPath";
import { execVersion } from "./lib/commands/execVersion";

setTimeout(main, 0);

async function main(){
    try
    {
        const command = parseUserInput();
        if (!command.command || command.command === "help" || command.help) {
            printUsageAndCommands();
        }
        else {
            await dispatchCommand(command);
        }
    }
    catch (err) {
        if (err instanceof UnknownCommandError) {
            console.error(red(err.message));
            printCommands();
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
            printUccInfo();
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
        printUsageAndCommands();
        throw error;
    }
}

function printUsageAndCommands(){
    const USAGE_INFO = `ucx command [--option optionValue] path1 path2 path3 ...`;
    console.log(USAGE_INFO);
    printCommands();
}

function printCommands() {
    console.log(" - available commands:", Object.keys(knownCommands).map(c => bold(c)).join(', '));
}

function printUccInfo() {
    const INVALID_UCC_INFO = `path to UCC must be provided either via env var ${
        bold('UCC_PATH')}  or cli argument ${bold('--ucc')}`;
    console.log(INVALID_UCC_INFO);
}