import { UcxCommand } from "../cli";
import { Subprocess } from "./subprocess/Subprocess";
import { detectPathSeparator, pathUpOneLevel } from "./filesystem";

export async function execUe(cmd: UcxCommand): Promise<void> {
    let path = cmd.uccPath;
    const separator = detectPathSeparator(cmd.uccPath);
    path = pathUpOneLevel(path, separator);
    path += separator + "UnrealEd.exe";

    new Subprocess(path, ...cmd.files).execCommand();
}