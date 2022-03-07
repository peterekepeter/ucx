import { ParserToken, SemanticClass } from "../../parser";
import { LintResult } from "../LintResult";
import { TokenBasedLinterV2 } from "../TokenBasedLinter";

export class ValidateStringRule implements TokenBasedLinterV2 
{
    nextToken(parserToken: ParserToken): LintResult[] | null {
        if (parserToken.type !== SemanticClass.LiteralString){
            return null;
        }
        const tokenText = parserToken.text;
        if (!tokenText.startsWith('"') || !tokenText.endsWith('"')){
            return null;
        }
        let results: LintResult[] = [];
        
        const tabEscapeIndex = tokenText.indexOf("\\t");
        if (tabEscapeIndex !== -1){
            const line = parserToken.line;
            const position = parserToken.position;
            results.push({
                line, position: position + tabEscapeIndex, length: 2,
                message: "The '\\t' doesn't work in unreal strings.",
            });
        }

        return results;
    }
    
}