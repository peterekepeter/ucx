import { exec, execSync, spawn } from "child_process";
import { SubprocessCommand } from "./CommandBuilder";
import { green, yellow, gray, blue, red, bold } from "../terminal";
import { promises as fs, watchFile as fsWatchFile } from "fs";
import { SubprocessError } from "./SubprocessError";

export async function runSubprocess(command: SubprocessCommand): Promise<void>
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
        if (!printLogFile){
            return;
        }
        
        if (!command.logFile) {
            console.log(yellow("warn: log file not detected!"));
            return;
        }
    
        const logContent = await fs.readFile(command.logFile, 'utf8');
        const decorated = decorateLog(logContent, quiet);
        console.log(decorated);
    }
} 

function decorateLog(input: string, quiet: boolean): string{
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

            if (i.startsWith('Error:'))
            {
                tag = red(bold(tag));
            }
            else if  (i.startsWith('Critical:'))
            {
                tag = red(tag);
            }
            else if (i.startsWith('Warning:')) {
                tag = yellow(bold(tag));
            }
            else if (i.startsWith('Heading:')) {
                tag = blue(tag);
                rest = rest.replace(/\w/g, s => bold(s));
                rest = rest.replace(/-{20}/g, s => gray(s));
            }
            else if (i.startsWith('Log: Success')) {
                tag = green(bold(tag));
            }
            else {
                tag = gray(tag);
            }
            return tag + rest;
        })
        .join('\n');
}