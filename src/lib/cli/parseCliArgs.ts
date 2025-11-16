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
    let expectUccPath = false;
    for (let i=2; i<argv.length; i++){
        const arg = argv[i];
        if (expectUccPath){
            result.uccPath = arg;
            expectUccPath = false;
        }
        else if (arg.startsWith('--')){
            switch (arg){
            case '--verbose':
                result.verbose = true;
                break;
            case '--quiet':
                result.quiet = true;
                break;
            case '--package-mangle':
                result.noPackageMangle = false;
                break;
            case '--no-package-mangle':
                result.noPackageMangle = true;
                break;
            case '--no-clean':
                result.noClean = true;
                break;
            case '--ucc':
                expectUccPath = true;
                break;
            case '--help':
                result.help = true;
                break;
            case '--bench':
                result.benchmark = true;
                break;
            case '--benchmark':
                result.benchmark = true;
                break;
            case '--bench10':
                result.benchmark = true;
                result.runcount = 10;
                break;
            case '--bench20':
                result.benchmark = true;
                result.runcount = 20;
                break;
            case '--bench30':
                result.benchmark = true;
                result.runcount = 30;
                break;
            default:    
                errors.push(`Unknown argument "${arg}"`);
            }
        }
        else if (arg.startsWith('-')) {
            for (const char of arg.slice(1)) switch (char) {
            case 'v': 
                result.verbose = true; 
                break;
            case 'q': 
                result.quiet = true; 
                break;
            case 'h': 
                result.quiet = true; 
                break;
            }
        }
        else if (!result.command){
            result.command = arg;
            if (arg === 'ucc' || arg === 'ut' || arg === "ue") {
                // bypass parsing
                result.files = argv.slice(i+1);
                return result;
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