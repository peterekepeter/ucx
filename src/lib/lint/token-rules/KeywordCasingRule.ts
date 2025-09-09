import { ParserToken, SemanticClass } from "../../parser";
import { LintResult } from "../LintResult";
import { TokenBasedLinterV2 } from "../TokenBasedLinter";


export class KeywordCasingRule implements TokenBasedLinterV2
{
    nextToken(token: ParserToken): LintResult[] | null {
        var expected: string;
        switch (token.type) {
            case SemanticClass.Keyword:
            case SemanticClass.ModifierKeyword:
                expected = token.textLower;
                break;
            case SemanticClass.LanguageConstant:
                switch (token.textLower) {
                    case 'none': expected = 'None'; break;
                    case 'true': expected = 'True'; break;
                    case 'false': expected = 'False'; break;
                    default: return null;
                }
                break;
            case SemanticClass.LanguageVariable:
                switch (token.textLower) {
                    case 'self': expected = 'Self'; break;
                    case 'super': expected = 'Super'; break;
                    case 'default': expected = 'Default'; break;
                    case 'static': expected = 'Static'; break;
                    default: return null;
                }
                break;
            default: 
                return null;
        }
        if (token.text === expected){
            return null;
        }
        return [{
            line: token.line, 
            position: token.position,
            length: token.text.length,
            message: `Expected '${expected}' found '${token.text}'`,
            fixedText: expected,
            originalText: token.text
        }];
    }
    
}
