import { LinkedEditingRanges } from "vscode";
import { LintResult } from "../LintResult";
import { TokenBasedLinter, TokenBasedLinterV2 } from "../TokenBasedLinter";
import { getIndentLevel } from "../../indentation/getIndentLevel";
import { toIndentString } from "../../indentation/toIndentString";
import { ParserToken, SemanticClass } from "../../parser";

const BRACKET_TOKEN = SemanticClass.None;

export class BracketSpacingRule implements TokenBasedLinterV2
{
    prevLine = -1;
    prevToken = '';
    prevParserToken: ParserToken|null = null;

    nextToken(parserToken: ParserToken, textLines: string[]): LintResult[] | null 
    {
        if (parserToken.type != BRACKET_TOKEN && this.prevParserToken?.type != BRACKET_TOKEN){
            this.prevToken = parserToken.text;
            this.prevParserToken = parserToken;
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
            if (token === '{' && parserToken.type === BRACKET_TOKEN)
            {
                insertNewline = true;
                insertIndent = getIndentLevel(lineText);
                message = "Add newline before '{'";
            }
            else if (this.prevToken === '{' && this.prevParserToken?.type === BRACKET_TOKEN)
            {
                insertNewline = true;
                message = "Add newline after '{'";
                insertIndent = getIndentLevel(lineText) + 1;
            }
            if (token === '}' && parserToken.type === BRACKET_TOKEN)
            {
                insertNewline = true;
                message = "Add newline before '}'";
                insertIndent = getIndentLevel(lineText) - 1;
            }
            else if (this.prevToken === '}' && this.prevParserToken?.type === BRACKET_TOKEN && parserToken.text !== ';')
            {
                insertNewline = true;
                message = "Add newline after '}'";
                insertIndent = getIndentLevel(lineText) - 1;
            }
        }

        this.prevLine = line;
        this.prevToken = token;
        this.prevParserToken = parserToken;
        
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


