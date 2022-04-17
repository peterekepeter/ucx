import { UcxCommand } from "./UcxCommand";

export function parseCliArgs(argv: string[]): Partial<UcxCommand>{
    const result : Partial<UcxCommand> = {};
    const errors = [];
    const files = [];
    if (argv[0]) {
        result.jsInterpreter = argv[0];
    } 
    if (argv[1]) {
        result.ucxScript = argv[1];
    }
    if (argv[2]) {
        result.command = argv[2];
    }
    let expectUccPath = false;
    for (let i=3; i<argv.length; i++){
        const arg = argv[i];
        if (expectUccPath){
            result.uccPath = arg;
            expectUccPath = false;
        }
        else if (arg.startsWith('--')){
            switch (arg){
            case '--ucc':
                expectUccPath = true;
                break;
            default:    
                errors.push(`Uknown argument "${arg}"`);
            }
        }
        else {
            files.push(arg);
        }
    }
    if (files.length > 0){
        result.files = files;
    }
    if (errors.length > 0){
        result.errors = errors;
    }
    return result;
}