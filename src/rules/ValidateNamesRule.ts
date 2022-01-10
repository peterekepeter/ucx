import { LintResult } from "../LintResult";
import { TokenBasedLinter } from "../TokenBasedLinter";

const validateRegex = /^'[a-z0-9]*'$/i;


export class ValidateNamesRule implements TokenBasedLinter 
{
    nextToken(line: number, position: number, tokenText: string): LintResult[] | null {
        if (!tokenText.startsWith("'") || !tokenText.endsWith("'")){
            return null;
        }
        let error = "";
        
        if (tokenText.length - 2 > 64){
            error = 'Names must be shorter than 64 characters!';
        }
        else if (tokenText.indexOf(' ') !== -1){
            error = 'Names cannot contain spaces!';
        }
        else if (tokenText.length - 2 > 64){
            error = 'Names must be shorter than 64 characters!';
        }
        else if (!validateRegex.test(tokenText))
        {
            error = 'Names should not contain special characters!';
        }

        if (error !== ''){
            return [{
                line, position, originalText: tokenText, length: tokenText.length, 
                message: error
            }];
        }
        return null;
    }
    
}