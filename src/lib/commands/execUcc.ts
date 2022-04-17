import { exec } from "child_process";
import { UcxCommand } from "../cli";



export async function execUcc(cmd: UcxCommand): Promise<void> {

    const line = [cmd.uccPath, ...cmd.files].map(item => {
        const escaped = item.replace(/"/g,"\\\"");
        return `"${escaped}"`;
    }).join(' ');
    console.log('to execute', line);

    return new Promise((resolve, reject) => {
        exec(line, {
        }, (error, stdout, stderr) => {
            console.log(stdout);
            // console.error(stderr);
            if (error){
                reject(error);
            }
            else {    
                resolve();
            }
        });
    });
}