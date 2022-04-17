import { UcxCommand } from "./UcxCommand";


const UCC_PATH = 'UCC_PATH';

export function parseEnvArgs(env: { [key:string]:string|undefined }): Partial<UcxCommand> {
    const result: Partial<UcxCommand> = {};
    for (const key in env){
        if (key === UCC_PATH)
        {
            result.uccPath = env[key];
        }
    }
    return result;
}