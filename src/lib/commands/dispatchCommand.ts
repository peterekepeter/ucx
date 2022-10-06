import { UcxCommand } from "../cli";
import { execBuild } from "./execBuild";
import { execUcc } from "./execUcc";
import { execUe } from "./execUe";
import { execUt } from "./execUt";
import { UnknownCommandError } from "./UnknownCommandError";


export async function dispatchCommand(cmd: UcxCommand): Promise<void> {
    switch(cmd.command){
    case "build":
        await execBuild(cmd);
        break;
    case "ucc":
        await execUcc(cmd);
        break;
    case "ut":
        await execUt(cmd);
        break;
    case "ue":
        await execUe(cmd);
        break;
    default:
        throw new UnknownCommandError(`unknown command "${cmd.command}"`);
    }
}