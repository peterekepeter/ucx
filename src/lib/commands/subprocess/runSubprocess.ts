import { exec, execSync, spawn } from "child_process";
import { SubprocessCommand } from "./CommandBuilder";
import { green, yellow, gray, blue, red, bold } from "../terminal";
import { promises as fs, watchFile as fsWatchFile } from "fs";
import { SubprocessError } from "./SubprocessError";

const EMPTY_MAP = {};

export async function runSubprocess(command: SubprocessCommand, loggingPathRemap: Record<string, string> = EMPTY_MAP, ignoreLoadWarnings: string[]): Promise<void>
{
    let printLogFile = command.preferredLogMode === 'logfile' && command.logFile != null;
    try 
    {
        execSync(command.command, {
            stdio: printLogFile ? 'ignore' : 'inherit'
        });
    }
    catch (err){
        throw new SubprocessError("subprocess failed: " + command.command);
    }
    finally
    {
        if (printLogFile && command.logFile){
            const logContent = await fs.readFile(command.logFile, 'utf8');
            const decorated = decorateLog(logContent, command.quiet, command.verbose, loggingPathRemap, ignoreLoadWarnings);
            console.log(decorated);
        }
        else if (!command.logFile) {
            console.log(yellow("warn: log file not detected!"));
        }
    }
} 

function decorateLog(input: string, quiet: boolean, verbose: boolean, loggingPathRemap: Record<string, string>, ignoreLoadWarnings: string[]): string{
    
    const whitespace = /^\s*$/;
    const remapRegexes: Record<string, RegExp> = {};
    for (const key in loggingPathRemap) {
        const escaped = key; // TODO regexp escape 
        const regex = new RegExp("(\\.{1,2}|[A-Z]:|)([\\/\\\\])([\\w\\s\\._-]+[\\/\\\\]){0,}" + escaped, "gism");
        remapRegexes[key] = regex;
    }

    return input.split('\n')
        .filter(i => {
            if (verbose) {
                return true;
            }
            if (whitespace.test(i)) {
                return false;
            }
            else if (i.startsWith("Log:") || i.startsWith("Heading:"))
            {
                return false;
            }
            else if (i.startsWith("Warning:") && quiet) {
                return false;
            }
            else if (i.startsWith("Warning:") && i.includes("Can't find file")){
                for (const item of ignoreLoadWarnings) {
                    if (i.includes(item)) {
                        return false;
                    }
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
                if (rest.includes(key) && !rest.includes('SystemConform')) {
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