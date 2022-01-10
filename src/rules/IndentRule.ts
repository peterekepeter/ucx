import { LintResult } from "../LintResult";
import { TokenBasedLinter } from "../TokenBasedLinter";

export class IndentRule implements TokenBasedLinter 
{
    lastLine = Number.MAX_SAFE_INTEGER;
    indentLevel = 0;
    controlStructureState: null | 'keyword' | 'parenOpened' | 'parenClosed' = null;
    controlStructureIndent = 0;
    controlStructureElse = false;

    nextToken(line: number, position: number, token: string, lineText: string): LintResult[] | null {
        if (line < this.lastLine || line === 0){
            // document change
            this.indentLevel = 0;
        }

        // handle control
        if (token === 'for' || token === 'if' || token === 'while') {
            this.controlStructureState = 'keyword';
            if (this.controlStructureElse)
            {
                this.controlStructureElse = false;
                this.controlStructureIndent--;
            }
        }
        if (this.controlStructureState != null){
            if (token === '(' && this.controlStructureState === 'keyword'){
                this.controlStructureState = 'parenOpened';
            }
            if (token === ')' && this.controlStructureState === 'parenOpened'){
                this.controlStructureState = 'parenClosed'
                this.controlStructureIndent++;
            }
            if (token === '{' && this.controlStructureState === 'parenClosed'){
                this.controlStructureIndent--;
            }
            if (token === '}' || token === ';' && this.controlStructureState === 'parenClosed'){
                this.controlStructureIndent = 0;
                this.controlStructureState = null;
                this.controlStructureElse = false;
            }
        }

        if (token === '}' || token === ']' || token === ')'){
            this.indentLevel--;
        }
        let result: LintResult[] | null = null;
        if (line != this.lastLine){
            // line change
            let indentChars = 0;
            for (let i=0; i<lineText.length; i++){
                const char = lineText[i];
                if (char === '\t' || char === ' '){
                    indentChars++;
                }
                else {
                    break;
                }
            }
            let indent = lineText.substring(0, indentChars);
            let expectedIndent = toIndentString(this.indentLevel + this.controlStructureIndent);
            if (indent != expectedIndent){
                // correct it
                result = [{
                    line,
                    position: 0,
                    length: indent.length,
                    fixedText: expectedIndent,
                    message: `Expected ${expectedIndent} spaces`,
                    originalText: indent
                }]
            }
        }
        if (token === '{' || token === '[' || token === '('){
            this.indentLevel++;
        }

        if (token === 'else'){
            this.controlStructureState = 'parenClosed';
            this.controlStructureElse = true;
            this.controlStructureIndent++;
        }

        this.lastLine = line;
        return result;
    }

}

function toIndentString(count: number): string {
    if (count < 0){
        throw new Error('expected positive')
    }
    let s = '';
    switch(count){
        case  0: s = ''; break;
        case  1: s = '\t'; break;
        case  2: s = '\t\t'; break;
        case  3: s = '\t\t\t'; break;
        case  4: s = '\t\t\t\t'; break;
        case  5: s = '\t\t\t\t\t'; break;
        case  6: s = '\t\t\t\t\t\t'; break;
        case  7: s = '\t\t\t\t\t\t\t'; break;
        case  8: s = '\t\t\t\t\t\t\t\t'; break;
        case  9: s = '\t\t\t\t\t\t\t\t\t'; break;
        case 10: s = '\t\t\t\t\t\t\t\t\t\t'; break;
        case 11: s = '\t\t\t\t\t\t\t\t\t\t\t'; break;
        case 12: s = '\t\t\t\t\t\t\t\t\t\t\t\t'; break;
        case 13: s = '\t\t\t\t\t\t\t\t\t\t\t\t\t'; break;
        case 14: s = '\t\t\t\t\t\t\t\t\t\t\t\t\t\t'; break;
        case 15: s = '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t'; break;
        case 16: s = '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t'; break;
        case 17: s = '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t'; break;
        case 18: s = '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t'; break;
        case 19: s = '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t'; break;
        case 20: s = '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t'; break;
        default: s = toIndentString(Math.floor(count/2)) + toIndentString(Math.ceil(count/2)); break;
    }
    if (s.length != count){
        throw new Error('numberToSpaces implementation error');
    }
    return s;
}
