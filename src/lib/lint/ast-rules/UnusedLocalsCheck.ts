import { ParserToken, SemanticClass, UnrealClass } from "../../parser";
import { getAllFunctions, getAllBodyStatements, getAllStatements } from "../../parser/ast";
import { AstBasedLinter } from "../AstBasedLinter";
import { LintResult } from "../LintResult";

export class UnusedLocalsCheck implements AstBasedLinter
{
    lint(ast: UnrealClass): LintResult[] | null {
        let results: LintResult[] | null = null;
        for (const fn of getAllFunctions(ast)) {
            let symbols: { [key:string]: {
                isUsed: boolean,
                token: ParserToken,
            } } = {};
            let symbolCount = 0;
            for (const local of fn.locals) {
                if (local.name) {
                    symbols[local.name.textLower] = {
                        token: local.name,
                        isUsed: false,
                    };
                    symbolCount += 1;
                }
            }

            if (symbolCount === 0) {
                continue;
            }

            for (const st of getAllBodyStatements(fn.body)) {
                for (const arg of st.args) {
                    if ('textLower' in arg) {
                        switch (arg.type) {
                        case SemanticClass.Identifier:
                        case SemanticClass.VariableReference:
                            if (symbols[arg.textLower]) {
                                symbols[arg.textLower].isUsed = true;
                            }
                        }
                    }
                }
            }

            for (const symbol in symbols) {
                const state = symbols[symbol];
                if (state && !state.isUsed) {
                    if (!results) {
                        results = [];
                    }
                    results.push({
                        position: state.token.position,
                        line: state.token.line,
                        length: state.token.text.length,
                        message: `Unused local variable ${state.token.text}!`,
                    });
                }
            }
        }
        return results;
    }
}