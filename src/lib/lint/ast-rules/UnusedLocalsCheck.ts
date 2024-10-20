import { ParserToken, SemanticClass, UnrealClass } from "../../parser";
import { getAllClassFunctions, getStatementsRecursively, UnrealClassExpression } from "../../parser/ast";
import { Token } from "../../parser/types";
import { AstBasedLinter } from "../AstBasedLinter";
import { LintResult } from "../LintResult";

const UNUSED = 0;
const READ = 0x1;
const WRITE = 0x2;
const READWRITE = 0x3;

export class UnusedLocalsCheck implements AstBasedLinter
{
    lint(ast: UnrealClass): LintResult[] | null {
        let results: LintResult[] | null = null;
        for (const fn of getAllClassFunctions(ast)) {
            let symbols: { [key:string]: {
                token: ParserToken,
                flags: number,
            } } = {};
            let symbolCount = 0;
            for (const local of fn.locals) {
                if (local.name) {
                    symbols[local.name.textLower] = {
                        token: local.name,
                        flags: 0,
                    };
                    symbolCount += 1;
                }
            }

            if (symbolCount === 0) {
                continue;
            }

            let toCheck: (UnrealClassExpression | Token)[][] = [];
            for (const st of getStatementsRecursively(fn.body)) {
                // check op as well, since parser is incomplete the variable may be detected as an op
                if (st.op && (st.op.type === SemanticClass.Identifier || st.op.type === SemanticClass.VariableReference)) {
                    if (symbols[st.op.textLower]) {
                        this.updateSymbolState(ast, st.op.index, symbols[st.op.textLower]);
                    }
                }
                toCheck.push(st.args);
                while (toCheck.length > 0) {
                    const item = toCheck.pop();
                    if (!item) continue;
                    for (const arg of item) {
                        if ('textLower' in arg) {
                            switch (arg.type) {
                            case SemanticClass.Identifier:
                            case SemanticClass.VariableReference:
                                if (symbols[arg.textLower]) {
                                    this.updateSymbolState(ast, arg.index, symbols[arg.textLower]);
                                }
                            }
                        }
                        else {
                            toCheck.push(arg.args);
                            // check op as well, since parser is incomplete the variable may be detected as an op
                            if (arg.op && (arg.op.type === SemanticClass.Identifier || arg.op.type === SemanticClass.VariableReference)) {
                                if (symbols[arg.op.textLower]) {
                                    this.updateSymbolState(ast, arg.op.index, symbols[arg.op.textLower]);
                                }
                            }
                        }
                    }
                }
            }

            for (const symbol in symbols) {
                const state = symbols[symbol];
                if (state?.flags !== READWRITE) {
                    if (!results) {
                        results = [];
                    }
                    let message = 'ERROR?';
                    const varname = state.token.text;
                    if (state.flags === 0) {
                        message = `Unused local variable ${varname}!`;
                    }
                    else if (state.flags === WRITE) {
                        message = `Local variable ${varname} is modified to but never used!`;
                    }
                    else if (state.flags === READ) {
                        message = `Local variable ${varname} is used but never modified!`;
                    }
                    results.push({
                        position: state.token.position,
                        line: state.token.line,
                        length: state.token.text.length,
                        message,
                        unnecessary: true,
                    });
                }
            }
        }
        return results;
    }

    updateSymbolState(ast: UnrealClass, index: number, state: { flags: number; }) {
        if (state.flags === READWRITE) {
            return; // already readwrite
        }
        var left = ast.tokens[index - 1]?.text;
        if (left === '.') {
            // this is member access not local var
            return;
        }
        var tokens = ast.tokens.length;
        var right: string;
        var i = index + 1;

        do {
            right = ast.tokens[i].text;
            if (right === '.') {
                i += 2; // skip 2 items
                continue;
            }
            if (right === '[') {
                i += 1;
                let count = 1;
                while (count > 0 && i < tokens) {
                    right = ast.tokens[i].text;
                    if (right === '[') count += 1;
                    else if (right === ']') count -= 1;
                    i += 1;
                }
                continue;
            }
            break;
        } while (i < tokens);

        if (right === '++' || right === '--') {
            state.flags |= READWRITE;
            return;
        }

        if (
            left === '++' || left === '--'
            || ((left === '(' || left === ',') && (right === ')' || right === ',')) // function calls may be readwrite
        ) {
            state.flags |= READWRITE;
            return;
        }
        
        if (right === '=' || right === '+=' || right === '-=' || right === '*=' || right === '/=') {
            state.flags |= WRITE;
            return;
        }

        // by default consider as read
        state.flags |= READ;
    }

}