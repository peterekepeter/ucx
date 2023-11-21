import { CommandBuilder } from "./CommandBuilder";
import { detectPlatform } from "./detectPlatform";
import { runSubprocess } from "./runSubprocess";

export class Subprocess
{
    builder: CommandBuilder;
    loggingPathRemap: Record<string, string> = {};

    constructor(executablePath: string, ...args: string[])
    {
        const platform = detectPlatform(executablePath);
        this.builder = new CommandBuilder(platform);
        this.builder.push(executablePath);
        this.addArgs(...args);
    }

    useLogfileOutputIfAvailable(){
        this.builder.preferredLogMode = 'logfile';
    }

    addArgs(...arg: string[])
    {
        this.builder.push(...arg);
    }

    async execCommand()
    {
        const command = this.builder.getCommand();
        await runSubprocess(command, this.loggingPathRemap);
    }

    whenLoggingRemapProjectSource(buildName: string, projectDir: string) {
        this.loggingPathRemap[buildName] = projectDir;
    }
}