import { UnrealClass } from "../../parser";
import { getAllStatements, UnrealClassStatement } from "../../parser/ast";
import { AstBasedLinter } from "../AstBasedLinter";
import { LintResult } from "../LintResult";

export class SemicolonAutoFixer implements AstBasedLinter
{
    lint(ast: UnrealClass): LintResult[] | null {
        let result: LintResult[] | null = null;
        for (const st of getAllStatements(ast)){
            if (st.body.length > 0){
                continue; // is control
            }
            const lastToken = st.argsLastToken;
            if (!lastToken){
                throw new Error('unexpected missing token, parse error');
            }
            if (lastToken.text !== ';'){
                if (result == null){
                    result = [];
                }
                result.push({
                    message: 'Semicolon required after statement.',
                    position: lastToken.position + lastToken.text.length,
                    line: lastToken.line,
                    fixedText: ';',
                    length: 0,
                    originalText: '',
                    severity: "error"
                });
            }
        }
        return result;
    }
}
