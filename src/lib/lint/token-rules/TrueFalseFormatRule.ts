import { ParserToken, SemanticClass } from "../../parser";
import { LintResult } from "../LintResult";
import { TokenBasedLinter, TokenBasedLinterV2 } from "../TokenBasedLinter";

export class TrueFalseFormatRule implements TokenBasedLinterV2
{
    nextToken(token: ParserToken): LintResult[] | null {
        if (token.type !== SemanticClass.LanguageConstant){
            return null;
        }
        const tokenText = token.text;
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
            const line = token.line;
            const position = token.position;
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
