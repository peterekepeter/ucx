import { ParserToken, SemanticClass } from "../../parser";
import { LintResult } from "../LintResult";
import { TokenBasedLinterV2 } from "../TokenBasedLinter";

const validateRegex = /^'[a-z0-9_]*'$/i;


export class ValidateNamesRule implements TokenBasedLinterV2
{
    nextToken(parserToken: ParserToken): LintResult[] | null {
        if (parserToken.type !== SemanticClass.LiteralName){
            return null;
        }
        const tokenText = parserToken.text;
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
        else if (!validateRegex.test(tokenText))
        {
            error = 'Names should not contain special characters!';
        }

        if (error !== ''){
            const line = parserToken.line;
            const position = parserToken.position;
            return [{
                line, position, originalText: tokenText, length: tokenText.length, 
                message: error,
                severity: "error"
            }];
        }
        return null;
    }
    
}