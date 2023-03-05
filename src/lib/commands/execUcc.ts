import { UcxCommand } from "../cli";
import { Subprocess } from "./subprocess/Subprocess";

export async function execUcc(cmd: UcxCommand): Promise<void> {
    await new Subprocess(cmd.uccPath, ...cmd.files).execCommand();
}