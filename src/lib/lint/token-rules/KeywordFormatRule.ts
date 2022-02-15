import { ParserToken, SemanticClass } from "../../parser";
import { LintResult } from "../LintResult";
import { TokenBasedLinterV2 } from "../TokenBasedLinter";


export class KeywordFormatRule implements TokenBasedLinterV2
{
    nextToken(token: ParserToken): LintResult[] | null {
        if (token.type !== SemanticClass.Keyword){
            return null;
        }
        if (token.textLower === token.text){
            return null;
        }
        return [{
            line: token.line, 
            position: token.position,
            length: token.text.length,
            message: 'Keywords should be lowercase.',
            fixedText: token.textLower,
            originalText: token.text
        }];
    }
    
}
