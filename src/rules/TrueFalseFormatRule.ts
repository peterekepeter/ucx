import { LintResult } from "../LintResult";
import { TokenBasedLinter } from "../TokenBasedLinter";

export class TrueFalseFormatRule implements TokenBasedLinter 
{
    nextToken(line: number, position: number, tokenText: string): LintResult[] | null {
        const lowercase = tokenText.toLowerCase();
        let fixedText = tokenText;
        {
            // fix true
            const desiredTrueFormatting = "True";
            if (lowercase === "true" && tokenText !== desiredTrueFormatting){
                fixedText = desiredTrueFormatting;
            }
        }
        {
            // fix false
            const desiredFalseFormatting = "False";
            if (lowercase === "false" && tokenText !== desiredFalseFormatting){
                fixedText = desiredFalseFormatting;
            }
        }
        if (fixedText !== tokenText){
            return [{
                line, position,
                length: tokenText.length,
                message: "true/false values should always be lowercase",
                fixedText: fixedText,
                originalText: tokenText
            }];
        }
        return null;
    }
}
