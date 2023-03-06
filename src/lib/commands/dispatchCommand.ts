import { UcxCommand } from "../cli";
import { execBuild } from "./execBuild";
import { execUcc } from "./execUcc";
import { execUe } from "./execUe";
import { execUt } from "./execUt";
import { execVersion } from "./execVersion";
import { UnknownCommandError } from "./UnknownCommandError";


const knownCommands: Record<string,(cmd: UcxCommand) => Promise<void>> = {
    build: execBuild,
    ucc: execUcc,
    ut: execUt,
    ue: execUe,
    version: execVersion,
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