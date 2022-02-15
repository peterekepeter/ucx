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

        let prevIndent = 0;
        for (let line=0; line<ast.textLines.length; line++)
        {
            const indent = this.indent[line];
            let collapse = false;
            let collapseUntil = line;
            const difference = indent - prevIndent;
            if (difference >= 2){
                for (let i=line+1; i<ast.textLines.length; i++){
                    const scanIndent = this.indent[i];
                    if (scanIndent >= indent){
                        continue;
                    }
                    else if (scanIndent <= prevIndent){
                        collapse = true;
                        collapseUntil = i;
                        break;
                    }
                    else { // prevIndent < scanIndent < indent
                        break; // cannot collapse
                    }
                }
            }
            if (collapse) {
                const collapseBy = difference - 1;
                for (let i=line; i<collapseUntil; i++){
                    this.indent[i] -= collapseBy;
                } 
                prevIndent = indent - collapseBy;  
            }
            else {
                prevIndent = indent;
            }
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
            if (st.argsLastToken?.text !== ')'){
                this.paintDeclarationScope(st.argsFirstToken, st.argsLastToken);
            } else {
                this.paintBlockScope(st.argsFirstToken, st.argsLastToken);
            }
            this.recursivePaintArgsScope(st.args);

            this.paintBlockScope(st.bodyFirstToken, st.bodyLastToken);
            this.recursivePaintStatementScopes(st.body);
        }
    }

    recursivePaintArgsScope(args: (UnrealClassExpression | ParserToken)[]) {
        for (const arg of args) {
            if ('argsFirstToken' in arg){
                if (arg.argsLastToken?.text !== ')'){
                    this.paintDeclarationScope(arg.argsFirstToken, arg.argsLastToken);
                } else {
                    this.paintBlockScope(arg.argsFirstToken, arg.argsLastToken);
                }
                this.recursivePaintArgsScope(arg.args);
            }
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
