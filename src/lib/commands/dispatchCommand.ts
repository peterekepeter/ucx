import { UcxCommand } from "../cli";
import { execBuild } from "./execBuild";
import { execUcc } from "./execUcc";
import { execUt } from "./execUt";


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
    default:
        throw new Error(`unknown command "${cmd.command}"`);
    }
}