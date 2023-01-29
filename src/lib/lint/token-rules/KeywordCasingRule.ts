import { ParserToken, SemanticClass } from "../../parser";
import { LintResult } from "../LintResult";
import { TokenBasedLinterV2 } from "../TokenBasedLinter";


export class KeywordCasingRule implements TokenBasedLinterV2
{
    mapping: { [key:string]: string };

    constructor()
    {
        const words = ['True', 'False', 'None', 'Self', 'Super'];
        this.mapping = {};
        for (const word of words) {
            this.mapping[word.toLowerCase()] = word;
        }
    }

    nextToken(token: ParserToken): LintResult[] | null {
        if (!this.isKeywordlike(token)){
            return null;
        }
        const expected = this.mapping[token.textLower] ?? token.textLower;
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

    isKeywordlike(token: ParserToken): boolean {
        switch(token.type) {
        case SemanticClass.Keyword:
        case SemanticClass.ModifierKeyword:
        case SemanticClass.LanguageConstant: 
            return true;
        default:
            return false;
        }
    }
    
    
}
