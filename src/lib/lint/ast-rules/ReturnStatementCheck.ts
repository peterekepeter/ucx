import { UnrealClass } from "../../parser";
import { getAllClassFunctions, getStatementsRecursively, getAllClassStatements } from "../../parser/ast";
import { AstBasedLinter } from "../AstBasedLinter";
import { LintResult } from "../LintResult";

export class ReturnStatementCheck implements AstBasedLinter
{
    lint(ast: UnrealClass): LintResult[] | null {
        let results: LintResult[] | null = null;
        for (const fn of getAllClassFunctions(ast)) {
            if (fn.returnType) {
                if (fn.bodyFirstToken === fn.bodyLastToken) {
                    continue;
                }
                let foundreturn = false;
                for (const st of getStatementsRecursively(fn.body)) {
                    if (st.op?.textLower === 'return') {
                        foundreturn = true;
                        if (st.args.length === 0) {
                            if (!results) {
                                results = [];
                            }
                            results.push({
                                line: st.op.line,
                                position: st.op.position,
                                length: st.op.text.length, // whole line
                                message: `Missing argument on return statement, expected a ${fn.returnType.text} return value!` ,
                            });
                        }
                    }
                }
                if (!foundreturn) {
                    if (!results) {
                        results = [];
                    }
                    results.push({
                        line: fn.returnType?.line,
                        position: fn.returnType?.position,
                        length: fn.returnType?.text.length,
                        message: `Function does not have return statement, expected a ${fn.returnType.text} return value!` ,
                    });
                }
            }
            else 
            {
                for (const st of getStatementsRecursively(fn.body)) {
                    if (st.op?.textLower === 'return') {
                        if (st.args.length !== 0) {
                            if (!results) {
                                results = [];
                            }
                            results.push({
                                line: st.op.line,
                                position: st.op.position,
                                length: st.op.text.length, // whole line
                                message: `Should not have return value when function does not have a declared return type!` ,
                            });
                        }
                    }
                }
            }
        }
        return results;
    }

}