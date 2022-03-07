import { LinkedEditingRanges } from "vscode";
import { LintResult } from "../LintResult";
import { TokenBasedLinter, TokenBasedLinterV2 } from "../TokenBasedLinter";
import { getIndentLevel } from "../../indentation/getIndentLevel";
import { toIndentString } from "../../indentation/toIndentString";
import { ParserToken, SemanticClass } from "../../parser";

export class BracketSpacingRule implements TokenBasedLinterV2
{
    prevLine = -1;
    prevToken = '';

    nextToken(parserToken: ParserToken, textLines: string[]): LintResult[] | null 
    {
        if (parserToken.type !== SemanticClass.None){
            // asumming {} brakets always classified as None
            return null;
        }

        let insertNewline = false;
        let message = '';
        let insertIndent = 0;

        const line = parserToken.line;
        const token = parserToken.text;
        const lineText = textLines[line];
        const position = parserToken.position;
        
        if (line === this.prevLine) 
        {
            if (token === '{')
            {
                insertNewline = true;
                insertIndent = getIndentLevel(lineText);
                message = "Add newline before '{'";
            }
            else if (this.prevToken === '{')
            {
                insertNewline = true;
                message = "Add newline after '{'";
                insertIndent = getIndentLevel(lineText) + 1;
            }
            if (token === '}')
            {
                insertNewline = true;
                message = "Add newline before '}'";
                insertIndent = getIndentLevel(lineText) - 1;
            }
            else if (this.prevToken === '}')
            {
                insertNewline = true;
                message = "Add newline after '}'";
                insertIndent = getIndentLevel(lineText) - 1;
            }
        }

        this.prevLine = line;
        this.prevToken = token;
        
        if (insertNewline)
        {
            if (insertIndent == null || insertIndent < 0){
                insertIndent = 0;
            }
            return [{
                position,
                line,
                length: 0,
                fixedText: '\n' + toIndentString(insertIndent),
                originalText: '',
                message
            }];
        }
        else 
        {
            return null;
        }
    }
    
}


