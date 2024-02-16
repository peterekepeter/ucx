import { getFilename } from "../filesystem";
import { PlatformType } from "./detectPlatform";

export type SubprocessCommand = {
    command: string, 
    platform: PlatformType,
    preferredLogMode: 'stdio' | 'logfile', 
    logFile: string|undefined, 
    executableFile: string|undefined 
    verbose: boolean, 
    quiet: boolean,
};

export class CommandBuilder 
{
    executableFile?: string;
    logFile?: string;
    args: string[] = [];
    preferredLogMode: 'stdio' | 'logfile' = 'stdio';
    quiet: boolean = false;
    verbose: boolean = false;

    constructor(public platform: PlatformType)
    {
        if (platform === PlatformType.Wine)
        {
            this.args.push('wine');
        }
    }
 
    push(...args: string[])
    {
        if (!this.executableFile && args.length > 0)
        {
            this.executableFile = args[0];
            this.logFile = this.detectLogFile();
        }
        this.args.push(...args);
    }

    getCommand(): SubprocessCommand
    {
        return {
            platform: this.platform,
            command: this.args.join(' '),
            logFile: this.logFile,
            preferredLogMode: this.preferredLogMode,
            executableFile: this.executableFile,
            quiet: this.quiet,
            verbose: this.verbose,
        };
    }

    private detectLogFile(): string | undefined {
        if (!this.executableFile)
        {
            return undefined;
        }
        if (this.platform === PlatformType.Linux)
        {
            // linux filename are hardcoded and stored in user home folder
            // TODO detect dir
            const logdir = '~/.utpg/System/';
            if (this.executableFile.match(/ucc|ucc-bin|ucc-bin-amd64/i))
            {
                return logdir + 'ucc.log';
            }
            if (this.executableFile.match(/ut-bin-amd64|ut-bin|ut/i))
            {
                return logdir + 'UnrealTournament.log';
            }
        }
        // unrealed seems to always log to Editor.log
        const filename = getFilename(this.executableFile);
        const dirpath = this.executableFile.substring(0, this.executableFile.length - filename.length);
        if (this.executableFile.match(/UnrealEd\.exe$/i))
        {
            return dirpath + "Editor.log";
        }
        // in general it depends on executable name
        const extensionIdx = filename.lastIndexOf('.');
        const logfile = filename.substring(0, extensionIdx) + '.log';
        return dirpath + logfile;
    }

}