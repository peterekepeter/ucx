import { LinkedEditingRanges } from "vscode";
import { LintResult } from "../LintResult";
import { TokenBasedLinter } from "../TokenBasedLinter";
import { getIndentLevel } from "../getIndentLevel";
import { toIndentString } from "../toIndentString";

export class BracketSpacingRule implements TokenBasedLinter 
{
    prevLine = -1;
    prevToken = '';

    nextToken(line: number, position: number, token: string, lineText: string): LintResult[] | null 
    {
        let insertNewline = false;
        let message = '';
        let insertIndent = 0;

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


