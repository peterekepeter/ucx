import { LintResult } from "../LintResult";
import { TokenBasedLinterV2 } from "../TokenBasedLinter";
import { getIndentLevel } from "../../indentation/getIndentLevel";
import { ParserToken, SemanticClass } from "../../parser";
import { IndentationType } from "../../indentation/IndentationType";
import { IndentLevelStrings } from "../../indentation/IndentLevelStrings";

const BRACKET_TOKEN = SemanticClass.None;

export class BracketSpacingRule implements TokenBasedLinterV2
{
    prevLine = -1;
    prevToken = '';
    prevParserToken: ParserToken|null = null;
    indentStrings = new IndentLevelStrings(this.indentType);

    constructor(private indentType: IndentationType){}

    nextToken(parserToken: ParserToken, textLines: string[]): LintResult[] | null 
    {
        if (parserToken.type !== BRACKET_TOKEN && this.prevParserToken?.type !== BRACKET_TOKEN){
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
                insertIndent = getIndentLevel(lineText, this.indentType);
                message = "Add newline before '{'";
            }
            else if (this.prevToken === '{' && this.prevParserToken?.type === BRACKET_TOKEN)
            {
                insertNewline = true;
                message = "Add newline after '{'";
                insertIndent = getIndentLevel(lineText, this.indentType) + 1;
            }
            if (token === '}' && parserToken.type === BRACKET_TOKEN)
            {
                insertNewline = true;
                message = "Add newline before '}'";
                insertIndent = getIndentLevel(lineText, this.indentType) - 1;
            }
            else if (this.prevToken === '}' && this.prevParserToken?.type === BRACKET_TOKEN && parserToken.text !== ';')
            {
                insertNewline = true;
                message = "Add newline after '}'";
                insertIndent = getIndentLevel(lineText, this.indentType);
            }
        }

        this.prevLine = line;
        this.prevToken = token;
        this.prevParserToken = parserToken;
        
        if (!insertNewline)
        {
            return null;
        }

        if (insertIndent == null || insertIndent < 0){
            insertIndent = 0;
        }
        
        return [{
            position,
            line,
            length: 0,
            fixedText: '\n' + this.indentStrings.getIndentString(insertIndent),
            originalText: '',
            message
        }];
    }
    
}


