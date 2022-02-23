import {AstBasedLinter} from "../AstBasedLinter";
import { LintResult } from "../LintResult";
import { UnrealClass } from "../../";
import { ParserToken, SemanticClass } from "../../parser";
import { toIndentString } from "../../indentation/toIndentString";
import { UnrealClassExpression, UnrealClassStatement } from "../../parser/ast/UnrealClassFunction";


export class AstIndentRule implements AstBasedLinter
{
    indent: number[] = [];

    lint(ast: UnrealClass): LintResult[] {
        this.paintScopes(ast);
        this.collapseDeepIndent(ast);
        return this.gatherLinterResults(ast);
    }
    
    paintScopes(ast: UnrealClass) {        
        this.indent = new Array(ast.textLines.length);
        this.indent.fill(0);
        
        this.paintScope(
            ast.classDeclarationFirstToken, ast.classDeclarationLastToken);

        for (const variable of ast.variables){
            this.paintScope(
                variable.firstToken, variable.lastToken);
        }
        
        for (const e of ast.enums) {
            this.paintScope(e.firstBodyToken, e.lastToken);
        }

        for (const fn of ast.functions){
            this.paintScope(fn.fnArgsFirstToken, fn.fnArgsLastToken);
            this.paintScope(fn.bodyFirstToken, fn.bodyLastToken);
            this.recursivePaintStatementScopes(fn.body);
        }
        
        this.paintScope(
            ast.defaultPropertiesFirstToken, ast.defaultPropertiesLastToken);
    }

    collapseDeepIndent(ast: UnrealClass){
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
    }

    gatherLinterResults(ast: UnrealClass): LintResult[] {
        const results: LintResult[] = [];
        let j=0;
        for (let line=0; line<ast.textLines.length; line++)
        {
            let lineFirstToken: ParserToken|null = null;
            for(;ast.tokens[j]?.line <= line; j++){
                if (!lineFirstToken && ast.tokens[j].line === line){
                    lineFirstToken = ast.tokens[j];
                }
            }
            if (lineFirstToken === null){
                continue; // ignore empty lines
            }
            if (lineFirstToken?.type === SemanticClass.Comment){
                continue; // ignore comment line
            }
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

    recursivePaintStatementScopes(body: UnrealClassStatement[]): void {
        for (const st of body) {
            this.paintScope(st.argsFirstToken, st.argsLastToken);
            this.recursivePaintArgsScope(st.args);

            if (st.bodyFirstToken?.text !== '{'){
                this.paintScope(st.op, st.bodyLastToken);
            } else {
                this.paintScope(st.bodyFirstToken, st.bodyLastToken);
            }
            this.recursivePaintStatementScopes(st.body);
        }
    }

    recursivePaintArgsScope(args: (UnrealClassExpression | ParserToken)[]) {
        for (const arg of args) {
            if ('argsFirstToken' in arg){
                this.paintScope(arg.argsFirstToken, arg.argsLastToken);
                this.recursivePaintArgsScope(arg.args);
            }
        }
    }

    paintScope(
        first?: ParserToken | null,
        last?: ParserToken | null
    ) {
        if (!first || !last){
            return;
        }
        const from = first.line + 1;
        let to = last.line;
        if (last.text !== '}' && last.text !== ')') {
            // declaration scope
        } else { 
            to -= 1; // block scope
        }
        this.paintIndentLines(from, to);
    }

    paintIndentLines(from: number, to: number) {
        for (let i=from; i<=to; i++){
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
