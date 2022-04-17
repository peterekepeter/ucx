import { exec } from "child_process";
import { UcxCommand } from "../cli";



export async function execUcc(cmd: UcxCommand): Promise<void> {

    const line = [cmd.uccPath, ...cmd.files].map(item => {
        const escaped = item.replace(/"/g,"\\\"");
        return `"${escaped}"`;
    }).join(' ');
    console.log('to execute', line);

    return new Promise((resolve, reject) => {
        const child = exec(line, {
        }, (error, stdout, stderr) => {
            if (error){
                reject(error);
            }
            else {    
                resolve();
            }
        });
        if (child.stdout){
            child.stdout.pipe(process.stdout);
        }
        if (child.stderr){
            child.stderr.pipe(process.stderr);
        }
    });
}