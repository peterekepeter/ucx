import { exec, execSync, spawn } from "child_process";
import { SubprocessCommand } from "./CommandBuilder";
import { green, yellow, gray, blue, red, bold } from "../terminal";
import { promises as fs, watchFile as fsWatchFile } from "fs";
import { SubprocessError } from "./SubprocessError";

const EMPTY_MAP = {};

export async function runSubprocess(command: SubprocessCommand, loggingPathRemap: Record<string, string> = EMPTY_MAP): Promise<void>
{
    let printLogFile = command.preferredLogMode === 'logfile' && command.logFile != null;
    let quiet = false;
    try 
    {
        execSync(command.command, {
            stdio: printLogFile ? 'ignore' : 'inherit'
        });
        quiet = true;
    }
    catch (err){
        throw new SubprocessError("subprocess failed: " + command.command);
    }
    finally
    {
        if (printLogFile && command.logFile){
            const logContent = await fs.readFile(command.logFile, 'utf8');
            const decorated = decorateLog(logContent, quiet, loggingPathRemap);
            console.log(decorated);
        }
        else if (!command.logFile) {
            console.log(yellow("warn: log file not detected!"));
        }
    }
} 

function decorateLog(input: string, quiet: boolean, loggingPathRemap: Record<string, string>): string{
    
    const remapRegexes: Record<string, RegExp> = {};
    for (const key in loggingPathRemap) {
        const escaped = key; // TODO regexp escape 
        const regex = new RegExp("(\\.{1,2}|[A-Z]:|)([\\/\\\\])([\\w\\s\\._-]+[\\/\\\\]){0,}" + escaped, "gism");
        remapRegexes[key] = regex;
    }

    return input.split('\n')
        .filter(i => {
            if (!quiet) {
                return true;
            }
            if (i.startsWith("Log:"))
            {
                if (i.includes("Unloading: Package") ||
                    i.includes("Compiling") ||
                    i.includes("Parsing") ||
                    i.includes("Imported:")||
                    i.includes("Bound to")||
                    i.includes("Unbound to")||
                    i.includes("FactoryCreateBinary:")||
                    i.includes("FactoryCreateText:")){
                    return false;
                }
            }
            else if (i.startsWith("DevCompile:") || 
                    i.startsWith("Uninitialized:") || 
                    i.startsWith("Exit:") || 
                    i.startsWith("Init:"))
            {
                return false;
            }
            return true;
        })
        .map(i => {
            const index = i.indexOf(':');
            let tag = i.substring(0, index + 1);
            let rest = i.substring(index + 1);

            for (const key in loggingPathRemap) {
                // remap project directory
                if (rest.includes(key)) {
                    const regex = remapRegexes[key];
                    const path = loggingPathRemap[key];
                    rest = rest.replace(regex, path);
                }
                // fix line numbers in paths
                rest = rest.replace(
                    /((?:\.{1,2}|[A-Z]:|)(?:[\/\\])(?:[\w\s\._-]+[\/\\]){0,}[\w\s\._-]+)\((\d+)\)/gmi,
                    (match, source = '', line = '') => bold(`${
                        (source as string).replace(/\\/g, "/") // prefer unix path
                    }:${line}`)
                );

            }

            if (i.startsWith('Error:'))
            {
                tag = red(bold(tag));
            }
            else if  (i.startsWith('Critical:'))
            {
                tag = red(tag);
            }
            else if (i.startsWith('Warning:') || i.startsWith('ExecWarning:')) {
                tag = yellow(bold(tag));
            }
            else if (i.startsWith('Heading:')) {
                tag = blue(tag);
                rest = rest.replace(/\w/g, s => bold(s));
                rest = rest.replace(/-{20}/g, s => gray(s));
            }
            else if (i.startsWith('Log: Success')) {
                tag = bold(green(tag));
            }
            else {
                tag = gray(tag);
            }
            return tag + rest;
        })
        .join('\n');
}