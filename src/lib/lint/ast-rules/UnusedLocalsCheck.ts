import { ParserToken, SemanticClass, UnrealClass } from "../../parser";
import { getAllFunctions, getAllBodyStatements, getAllStatements, UnrealClassExpression } from "../../parser/ast";
import { Token } from "../../parser/types";
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

            let toCheck: (UnrealClassExpression | Token)[][] = [];
            for (const st of getAllBodyStatements(fn.body)) {
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
                                    symbols[arg.textLower].isUsed = true;
                                }
                            }
                        }
                        else {
                            toCheck.push(arg.args);
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
                        unnecessary: true,
                    });
                }
            }
        }
        return results;
    }
}