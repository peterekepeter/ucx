import { ParserToken, SemanticClass } from "../../parser";
import { LintResult } from "../LintResult";
import { TokenBasedLinterV2 } from "../TokenBasedLinter";


export class NoneFormatRule implements TokenBasedLinterV2
{
    nextToken(token: ParserToken): LintResult[] | null {
        if (token.type !== SemanticClass.LanguageConstant){
            return null;
        }
        if (token.text !== "None" && token.textLower === "none"){
            return [{
                line: token.line, 
                position: token.position,
                length: token.text.length,
                message: 'None should be in PascalCase',
                fixedText: "None",
                originalText: token.text
            }];
        }
        return null;
    }
}

