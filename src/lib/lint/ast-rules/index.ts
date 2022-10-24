import { IndentationType } from "../../indentation/IndentationType";
import { AstBasedLinter } from "../AstBasedLinter";
import { LintResult } from "../LintResult";
import { AstIndentRule } from "./AstIndentRule";
import { EmptyLineBeforeFunction } from "./EmptyLineBeforeFunction";
import { OperatorSpacing } from "./OperatorSpacing";
import { SemicolonAutoFixer } from "./SemicolonAutoFixer";

export type AstLinterConfiguration =
{
    indentType: IndentationType,
    indentEnabled: boolean,
    emptyLineBeforeFunctionEnabled: boolean,
    operatorSpacingEnabled: boolean,
    semicolorFixEnabled: boolean,
};

export const DEFAULT_AST_LINTER_CONFIGURATION: AstLinterConfiguration = {
    emptyLineBeforeFunctionEnabled: true,
    indentEnabled: true,
    indentType: '\t',
    operatorSpacingEnabled: true,
    semicolorFixEnabled: true
};

export function buildAstLinter(partialConfig?: Partial<AstLinterConfiguration>): AstBasedLinter
{
    const config: AstLinterConfiguration = {
        ...DEFAULT_AST_LINTER_CONFIGURATION,
        ...partialConfig
    };
    const children = new Array<AstBasedLinter>();

    if (config.indentEnabled)
    {
        children.push(new AstIndentRule(config.indentType));
    }

    if (config.emptyLineBeforeFunctionEnabled)
    {
        children.push(new EmptyLineBeforeFunction());
    }

    if (config.operatorSpacingEnabled)
    {
        children.push(new OperatorSpacing());
    }

    if (config.semicolorFixEnabled)
    {
        children.push(new SemicolonAutoFixer());
    }

    return {
        lint: (ast) => {
            let result: LintResult[] | null = null;
            for (const child of children){
                const childResult = child.lint(ast);
                if (childResult && childResult.length > 0){
                    if (result == null){
                        result = childResult;
                    }
                    else {
                        result.push(...childResult);
                    }
                }
            }
            return result;
        }
    };
}