import { IndentationType } from "../indentation/IndentationType";
import { AstBasedLinter } from "../AstBasedLinter";
import { LintResult } from "../LintResult";
import { AstIndentRule } from "./AstIndentRule";
import { ClassNamingRule } from "./ClassNamingRule";
import { ControlConditionSpacing } from "./ControlConditionSpacing";
import { EmptyLineBeforeFunction } from "./EmptyLineBeforeFunction";
import { OperatorSpacing } from "./OperatorSpacing";
import { RedundantDefaultValue } from "./RedundantDefaultValue";
import { SemicolonAutoFixer } from "./SemicolonAutoFixer";

export type AstLinterConfiguration =
{
    linterEnabled: boolean,
    indentType: IndentationType,
    indentEnabled: boolean,
    emptyLineBeforeFunctionEnabled: boolean,
    operatorSpacingEnabled: boolean,
    semicolorFixEnabled: boolean,
    classNamingRule: boolean,
    controlConditionSpacing: boolean,
    redundantDefaultValue: boolean,
};

export const DEFAULT_AST_LINTER_CONFIGURATION: AstLinterConfiguration = {
    linterEnabled: true,
    emptyLineBeforeFunctionEnabled: true,
    indentEnabled: true,
    indentType: '\t',
    operatorSpacingEnabled: true,
    semicolorFixEnabled: true,
    classNamingRule: true,
    controlConditionSpacing: true,
    redundantDefaultValue: true,
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

    if (config.classNamingRule) {
        children.push(new ClassNamingRule());
    }

    if (config.controlConditionSpacing) {
        children.push(new ControlConditionSpacing());
    }

    if (config.redundantDefaultValue) {
        children.push(new RedundantDefaultValue);
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