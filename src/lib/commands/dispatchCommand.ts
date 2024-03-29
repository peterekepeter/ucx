import { UcxCommand } from "../cli";
import { execBuild } from "./execBuild";
import { execLint } from "./execLint";
import { execUcc } from "./execUcc";
import { execUe } from "./execUe";
import { execUt } from "./execUt";
import { execVersion } from "./execVersion";
import { UnknownCommandError } from "./error";


export const knownCommands: Record<string,(cmd: UcxCommand) => Promise<void>> = {
    build: execBuild,
    ucc: execUcc,
    ut: execUt,
    ue: execUe,
    version: execVersion,
    lint: execLint,
};


export async function dispatchCommand(cmd: UcxCommand): Promise<void> {
    if (cmd.command in knownCommands){
        const fn = knownCommands[cmd.command];
        await fn(cmd);
    } else {
        const message = `Unknown command "${cmd.command}"`;
        const commandList = Object.keys(knownCommands);
        throw new UnknownCommandError(message, commandList);
    }
}