import { ParserToken, UnrealClass } from "../../parser";
import { getAllClassFunctions, UnrealClassFunctionLocal, UnrealClassVariable } from "../../parser/ast";
import { AstBasedLinter } from "../AstBasedLinter";
import { LintResult } from "../LintResult";

export class TypeCheckRule implements AstBasedLinter
{
    lint(ast: UnrealClass): LintResult[] | null {
        const result: LintResult[] = [];
        for (const item of ast.variables) {
            this.checkVarType(result, item);
        }
        for (const fn of getAllClassFunctions(ast))
        {
            for (const item of fn.locals)
            {
                this.checkBoolVarLocal(result, item, ast);
            }
        }
        for (const struct of ast.structs) {
            for (const member of struct.members){
                this.checkVarType(result, member);
            }
        }
        if (result && result.length > 0) return result;
        return null;
    }
    checkBoolVarLocal(result: LintResult[], item: UnrealClassFunctionLocal, ast: UnrealClass) {
        if (item.type?.textLower === "bool")
        {
            if (item.name)
            {
                let idx = item.name.index;
                let next = ast.tokens[idx+1];
                if (next && next.text == "[")
                {
                    this.emitBoolVarError(result, item.name);
                }
            }
        }
    }

    checkVarType(result: LintResult[], item: UnrealClassVariable) {
        if (item.type?.textLower === "bool")
        {
            if (item.arrayCount != null 
                || item.arrayCountExpression != null 
                || item.arrayCountToken != null)
            {
                this.emitBoolVarError(result, item.name);
            }
        }
    }

    emitBoolVarError(result: LintResult[], name: ParserToken | null) {
        result.push({
            message: "Bool arrays are not allowed",
            line: name?.line,
            position: name?.position,
            length: name?.text.length,
            severity: "error",
        })
    }

}