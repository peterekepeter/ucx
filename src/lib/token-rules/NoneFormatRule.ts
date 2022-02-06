import { LintResult } from "../LintResult";
import { TokenBasedLinter } from "../TokenBasedLinter";


export class NoneFormatRule implements TokenBasedLinter 
{
    nextToken(line: number, position: number, tokenText: string): LintResult[] | null {
        const lowercase = tokenText.toLowerCase();
        if (lowercase === "none" && tokenText !== "None"){
            return [{
                line, position,
                length: tokenText.length,
                message: 'None should be in PascalCase',
                fixedText: "None",
                originalText: tokenText
            }];
        }
        return null;
    }
}

