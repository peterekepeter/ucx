#!/usr/bin/env node

import { DEFAULT_UCX_COMMAND, parseCliArgs, parseEnvArgs,  } from "./lib/cli";
import { dispatchCommand } from "./lib/commands/dispatchCommand";
import { UnknownCommandError } from "./lib/commands/UnknownCommandError";


setTimeout(async function main(){
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
        if (err instanceof UnknownCommandError){
            console.error(err.message);
        }
        else {
            throw err;
        }
    }
}, 0);


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