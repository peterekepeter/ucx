import {AstBasedLinter} from "../AstBasedLinter";
import { LintResult } from "../LintResult";
import { UnrealClass } from "../../";
import { ParserToken } from "../../parser";
import { getIndentLevel } from "../../indentation/getIndentLevel";
import { toIndentString } from "../../indentation/toIndentString";
import { UnrealClassExpression, UnrealClassStatement } from "../../parser/ast/UnrealClassFunction";


export class AstIndentRule implements AstBasedLinter
{
    indent: number[] = [];

    lint(ast: UnrealClass): LintResult[] {
        const eofLine = (ast.classLastToken?.line ?? 0) + 1;
        const results: LintResult[] = [];
        this.indent = new Array(ast.textLines.length);
        this.indent.fill(0);
        
        this.paintDeclarationScope(
            ast.classDeclarationFirstToken, ast.classDeclarationLastToken);
        
        for (const variable of ast.variables){
            this.paintDeclarationScope(
                variable.firstToken, variable.lastToken);
        }

        for (const fn of ast.functions){
            this.paintBlockScope(fn.bodyFirstToken, fn.bodyLastToken);
            this.recursivePaintStatementScopes(fn.body);
        }

        for (let line=0; line<ast.textLines.length; line++)
        {
            const textLine = ast.textLines[line];
            const actual = this.getLineIndentString(textLine);
            const expectedCount = this.indent[line] ?? 0;
            const expected = toIndentString(expectedCount);
            if (actual !== expected){
                // correct it
                results.push({
                    line,
                    position: 0,
                    length: actual.length,
                    fixedText: expected,
                    message: `Expected ${expectedCount} tabs`,
                    originalText: actual
                });
            }
            
        }
        return results;
    }

    recursivePaintStatementScopes(body: UnrealClassStatement[]) {
        for (const st of body) {
            const maxLine = findLineMax(st.args);
            if (maxLine === st.argsLastToken?.line){
                this.paintDeclarationScope(st.argsFirstToken, st.argsLastToken);
            } else {
                this.paintBlockScope(st.argsFirstToken, st.argsLastToken);
            }
            this.paintBlockScope(st.bodyFirstToken, st.bodyLastToken);
            this.recursivePaintStatementScopes(st.body);
        }
    }

    paintDeclarationScope(
        first?: ParserToken | null,
        last?: ParserToken | null
    ) {
        if (!first || !last){
            return;
        }
        for (let i=first.line + 1; i<=last.line; i++){
            this.indent[i] += 1;
        }
    }

    paintBlockScope(
        first?: ParserToken | null,
        last?: ParserToken | null
    ) {
        if (!first || !last){
            return;
        }
        for (let i=first.line + 1; i<last.line; i++){
            this.indent[i] += 1;
        }
    }

    getLineIndentString(lineText: string): string {
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
        return indent;
    }
}
function findLineMax(args: (UnrealClassExpression | ParserToken)[]) {
    let line = -1;
    for (const arg of args){
        if ('op' in arg){
            if (arg.op && arg.op.line > line){
                line = arg.op.line;
            }
            line = Math.max(line, findLineMax(arg.args));
        }
        else 
        {
            line = Math.max(line, arg.line);
        }
    }
    return line;
}
