import { UnrealClass } from "../parser";
import { AstLinterConfiguration, buildAstLinter } from "./ast-rules";
import { LintResult } from "./LintResult";
import { buildTokenBasedLinter, TokenBasedLinterConfiguration } from "./token-rules";

export type FullLinterConfig = TokenBasedLinterConfiguration & AstLinterConfiguration;

export function buildFullLinter(partialConfig?: Partial<FullLinterConfig>){

    if (partialConfig?.linterEnabled === false) {
        return {
            lint(): LintResult[] { 
                return [];
            }
        };
    }

    const astLinter = buildAstLinter(partialConfig);
    const tokenLinter = buildTokenBasedLinter(partialConfig);

    return {
        lint(ast: UnrealClass): LintResult[] {
            let results = astLinter.lint(ast) ?? [];

            for (const token of ast.tokens){
                const result = tokenLinter.nextToken(token, ast.textLines);
                if (result != null){
                    results.push(...result);
                }
            }
            return results;
        }
    };
}