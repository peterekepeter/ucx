import { ParserToken, UnrealClass } from "../../parser";
import { getAllClassFunctions } from "../../parser/ast";
import { AstBasedLinter } from "../AstBasedLinter";
import { LintResult } from "../LintResult";
import { fixSpaceAroundToken } from "./fixSpacing";

export class TypeDeclarationSpacing implements AstBasedLinter
{
    lint(ast: UnrealClass): LintResult[] | null {
        let result: LintResult[] | null = null;
        for (const variable of ast.variables) {
            if (variable.template) {
                result = this.checkSpacingOfGenericType(ast, variable.template, result);
            }
        }
        for (const fn of getAllClassFunctions(ast))
        {
            for (const local of fn.locals) {
                if (local.template) {
                    result = this.checkSpacingOfGenericType(ast, local.template, result);
                }
            }
        }
        return result;
    }

    private checkSpacingOfGenericType(
        ast: UnrealClass, token: ParserToken, result: LintResult[] | null
    ):
        LintResult[] | null
    {
        var i = token.index;
        var before = ast.tokens[i - 2];
        if (before) {
            if (token.line === before.line && before.position + before.text.length !== token.position - 1) {
                // spacing before token is wrong
                result = fixSpaceAroundToken(
                    result, ast, i - 1,
                    '', 'Expected no space before <',
                    '', 'Expected no space after <'
                );
            }
        }
        var after = ast.tokens[i + 2];
        if (after) {
            if (token.line === after.line && token.position + token.text.length + 1 !== after.position) {
                // spacing after token is wrong
                result = fixSpaceAroundToken(
                    result, ast, i + 1,
                    '', 'Expected no space before >',
                    ' ', 'Expected one space after >'
                );
            }
        }
        return result;
    }
}
