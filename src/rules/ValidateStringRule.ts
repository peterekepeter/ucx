import { LintResult } from "../LintResult";
import { TokenBasedLinter } from "../TokenBasedLinter";

const validateRegex = /^'[a-z0-9]*'$/i;


export class ValidateStringRule implements TokenBasedLinter 
{
    nextToken(line: number, position: number, tokenText: string): LintResult[] | null {
        if (!tokenText.startsWith('"') || !tokenText.endsWith('"')){
            return null;
        }
        let results: LintResult[] = [];
        
        const tabEscapeIndex = tokenText.indexOf("\\t");
        if (tabEscapeIndex !== -1){
            results.push({
                line, position: position + tabEscapeIndex, length: 2,
                message: "The '\\t' doesn't work in unreal strings.",
            });
        }

        return results;
    }
    
}