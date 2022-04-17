import { UcxCommand } from "../cli";
import { execBuild } from "./execBuild";


export async function dispatchCommand(cmd: UcxCommand): Promise<void> {
    switch(cmd.command){
    case "build":
        await execBuild(cmd);
        break;
    default:
        throw new Error(`unknown command "${cmd.command}"`);
        break;
    }
}