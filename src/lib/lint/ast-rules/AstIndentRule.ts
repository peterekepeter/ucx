import { AstBasedLinter } from "../AstBasedLinter";
import { LintResult } from "../LintResult";
import { UnrealClass } from "../../";
import { ParserToken, SemanticClass } from "../../parser";
import { UnrealClassExpression, UnrealClassFunction, UnrealClassStatement } from "../../parser/ast/UnrealClassFunction";
import { IndentationType } from "../indentation/IndentationType";
import { IndentLevelStrings } from "../indentation/IndentLevelStrings";


export class AstIndentRule implements AstBasedLinter
{
    indent: number[] = [];
    indentStrings = new IndentLevelStrings(this.indentationType);

    constructor (
        private indentationType: IndentationType
    ) { }

    lint(ast: UnrealClass): LintResult[] {
        this.paintScopes(ast);
        this.collapseDeepIndent(ast);
        return this.gatherLinterResults(ast);
    }
    
    paintScopes(ast: UnrealClass) {        
        this.indent = new Array(ast.textLines.length);
        this.indent.fill(0);
        
        this.paintScope(
            ast, ast.classDeclarationFirstToken, ast.classDeclarationLastToken);

        for (const scopes of ast.variableScopes){
            this.paintScope(
                ast, scopes.firstToken, scopes.lastToken);
        }
        
        for (const e of ast.enums) {
            this.paintScope(ast, e.firstBodyToken, e.lastToken);
        }

        for (const fn of ast.functions){
            this.paintFunctionScopes(ast, fn);
        }
        
        this.paintScope(ast, 
            ast.defaultPropertiesFirstToken, ast.defaultPropertiesLastToken);

        for (const block of ast.replicationBlocks){
            this.paintScope(ast, block.bodyFirstToken, block.bodyLastToken);
            for (const statement of block.statements) {
                const tokens = statement.targets;
                this.paintScope(ast, tokens[0], tokens[tokens.length-1], true, true);
            }
        }

        for (const struct of ast.structs){
            this.paintScope(ast, struct.bodyFirstToken, struct.bodyLastToken);
        }

        for (const state of ast.states)
        {
            this.paintScope(ast, state.bodyFirstToken, state.bodyLastToken);
            for (const fn of state.functions)
            {
                this.paintFunctionScopes(ast, fn);
            }
            this.recursivePaintStatementScopes(ast, state.body);
        }
    }

    paintFunctionScopes(ast: UnrealClass, fn: UnrealClassFunction) {
        this.paintScope(ast, fn.fnArgsFirstToken, fn.fnArgsLastToken);
        this.paintScope(ast, fn.bodyFirstToken, fn.bodyLastToken);
        this.recursivePaintStatementScopes(ast, fn.body);
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
            const expected = this.indentStrings.getIndentString(expectedCount);
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

    recursivePaintStatementScopes(ast: UnrealClass, body: UnrealClassStatement[]): void {
        for (const st of body) {
            let amount = 1;
            if (st.op?.text === ':') {
                const line = st.argsFirstToken?.line ?? st.op.line;
                this.paintIndentLines(line, line, -1);
            } else if (st.op?.textLower === 'switch') {
                amount += 1;
            }
            const first = st.argsFirstToken;
            let last = st.argsLastToken;
            if (first && last) {
                while (first.index < last.index - 2
                    && last.text === ';' 
                    && ast.tokens[last.index-1].text === ')'
                    && ast.tokens[last.index-2].line !== ast.tokens[last.index-1].line) {
                    last = ast.tokens[last.index-1];
                }
            }

            this.paintScope(ast, first, last);

            if (st.bodyFirstToken?.text !== '{'){
                this.paintScope(ast, st.op, st.bodyLastToken, st.singleStatementBody, undefined, amount);
            } else {
                this.paintScope(ast, st.bodyFirstToken, st.bodyLastToken, undefined, undefined, amount);
            }
            this.recursivePaintStatementScopes(ast, st.body);
        }
    }
    paintScope(
        ast: UnrealClass,
        first?: ParserToken | null,
        last?: ParserToken | null,
        isSingleStatementBody?: boolean,
        dontSkipFirstLine?: boolean,
        amount = 1,
    ) {
        if (!first || !last){
            return;
        }
        const from = dontSkipFirstLine ? first.line : first.line + 1;
        let to = last.line;
        if (isSingleStatementBody || !this.isClosingSymbol(last)){
            // delcaration scope
        } else { 
            if (!this.hasNonClosingTokenOnSameLineBeforeToken(ast, last))
            {
                to -= 1;
            }
        }
        this.paintIndentLines(from, to, amount);
    }

    hasNonClosingTokenOnSameLineBeforeToken(ast: UnrealClass, token: ParserToken): boolean {
        for (let i = token.index; i >= 0; i -= 1)
        {
            const isSameLine = ast.tokens[i].line === token.line;
            if (!isSameLine) {
                return false;
            }
            if (!this.isClosingSymbol(ast.tokens[i])) {
                return true;
            }
        }
        return false;
    }
    
    isClosingSymbol(token: ParserToken): boolean {
        return token.text === '}' || token.text === ')';
    }

    paintIndentLines(from: number, to: number, amount: number) {
        for (let i=from; i<=to; i++){
            this.indent[i] += amount;
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
