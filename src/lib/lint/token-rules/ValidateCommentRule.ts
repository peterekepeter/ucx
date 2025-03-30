import { ParserToken, SemanticClass } from "../../parser";
import { LintResult } from "../LintResult";
import { TokenBasedLinterV2 } from "../TokenBasedLinter";



export class ValidateCommentRule implements TokenBasedLinterV2
{
    inComment = false;

    nextToken(token: ParserToken): LintResult[] | null {
        if (token.type === SemanticClass.Comment){
            if (token.text === '/*') {
                if (this.inComment) {
                    return [{
                        line: token.line, 
                        position: token.position, 
                        originalText: token.text, 
                        length: token.text.length, 
                        message: "Comment start token inside comment can crash unreal script compilers!",
                        severity: "error",
                        fixedText: "**",
                    }];
                }
                this.inComment = true;
            }
        }
        else {
            this.inComment = false;
        }
        return null;
    }
    
}