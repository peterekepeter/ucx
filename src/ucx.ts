#!/usr/bin/env node

import { DEFAULT_UCX_COMMAND, parseCliArgs, parseEnvArgs,  } from "./lib/cli";
import { dispatchCommand } from "./lib/commands/dispatchCommand";


setTimeout(async function main(){
    const command = parseUserInput();
    await dispatchCommand(command);
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