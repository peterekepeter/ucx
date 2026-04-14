import { UnrealClass } from "../../parser";
import { AstBasedLinter } from "../AstBasedLinter";
import { LintResult } from "../LintResult";

export class TypeCheckRule implements AstBasedLinter
{
    lint(ast: UnrealClass): LintResult[] | null {
        const result: LintResult[] = [];
        for (const item of ast.variables) {
            if (item.type?.textLower === "bool")
            {
                if (item.arrayCount != null || item.arrayCountExpression != null || item.arrayCountToken != null)
                {
                    result.push({
                        message: "Bool arrays are not allowed",
                        line: item.name?.line,
                        position: item.name?.position,
                        length: item.name?.text.length,
                        severity: "error",
                    })
                }
            }
        }
        if (result && result.length > 0) return result;
        return null;
    }

}