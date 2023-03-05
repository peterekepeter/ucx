import { UcxCommand } from "../cli";
import { detectPathSeparator, pathUpOneLevel } from "./filesystem";
import { Subprocess } from "./subprocess/Subprocess";

export async function execUt(cmd: UcxCommand): Promise<void> {
    let path = cmd.uccPath;
    const separator = detectPathSeparator(cmd.uccPath);
    path = pathUpOneLevel(path, separator);
    path += separator + "UnrealTournament.exe";
    
    new Subprocess(path, ...cmd.files).execCommand();
}
