import { FullLinterConfig } from "../lib/lint/buildFullLinter";
import { vscode } from "./vscode";
import { DEFAULT_AST_LINTER_CONFIGURATION as DEFAULT_A } from '../lib/lint/ast-rules';
import { DEFAULT_TOKEN_BASED_LINTER_CONFIGURATION as DEFAULT_T } from '../lib/lint/token-rules';
import { parseIndentationType } from '../lib/lint/indentation';

export type ExtensionConfiguration =
{
    libraryPath: string,
    searchLibrarySymbols: boolean,
    showErrors: boolean,
    showWarnings: boolean,
    overrideEditorIndentationStyle: boolean,
    linterConfiguration: FullLinterConfig,
};

export function parseConfiguration(cfg: vscode.WorkspaceConfiguration): ExtensionConfiguration {
    // TODO split and only parse what we need or find a way to cache this
    return {
        libraryPath: 
            cfg.get('libraryPath') ?? '',
        searchLibrarySymbols: 
            cfg.get('language.searchLibrarySymbols') ?? true,
        showErrors: 
            cfg.get('showErrors') ?? true,
        showWarnings: 
            cfg.get('showWarnings') ?? true,
        overrideEditorIndentationStyle: 
            cfg.get('overrideEditorIndentationStyle') ?? true,
        linterConfiguration: {
            linterEnabled: 
                cfg.get('linter.enabled') ?? DEFAULT_A.linterEnabled,
            classNamingRule: 
                cfg.get('linter.classNamingRule.enabled') ?? DEFAULT_A.classNamingRule,
            controlConditionSpacing: 
                cfg.get('linter.controlConditionSpacing.enabled') ?? DEFAULT_A.controlConditionSpacing,
            emptyLineBeforeFunctionEnabled:
                cfg.get('linter.emptyLineBeforeFunction.enabled') ?? DEFAULT_A.emptyLineBeforeFunctionEnabled,
            indentEnabled:
                cfg.get('linter.indentation.enabled') ?? DEFAULT_A.indentEnabled,
            indentType:
                parseIndentationType(cfg.get<string>('linter.indentation.style')) ?? DEFAULT_A.indentType,
            operatorSpacingEnabled:
                cfg.get('linter.operatorSpacing.enabled') ?? DEFAULT_A.operatorSpacingEnabled,
            redundantDefaultValue:
                cfg.get('linter.redundantDefaultValue.enabled') ?? DEFAULT_A.redundantDefaultValue,
            semicolorFixEnabled:
                cfg.get('linter.semicolonFix.enabled') ?? DEFAULT_A.semicolorFixEnabled,
            enableBracketSpacingRule:
                cfg.get('linter.bracketSpacingRule.enabled') ?? DEFAULT_T.enableBracketSpacingRule,
            enableValidateStringRule:
                cfg.get('linter.validateStringRule.enabled') ?? DEFAULT_T.enableKeywordCasingRule,
            enableValidateNamesRule:
                cfg.get('linter.validateNamesRule.enabled') ?? DEFAULT_T.enableValidateNamesRule,
            enableKeywordCasingRule:
                cfg.get('linter.keywordCasingRule.enabled') ?? DEFAULT_T.enableValidateStringRule,
            checkReturnTypes:
                cfg.get('linter.checkReturnTypes.enabled') ?? DEFAULT_A.checkReturnTypes,
            checkUnusedLocals:
                cfg.get('linter.checkUnusedLocals.enabled') ?? DEFAULT_A.checkUnusedLocals,
        }
    };
}

export function getEditorOptions(config: ExtensionConfiguration): vscode.TextEditorOptions {
    const indentType = config.linterConfiguration.indentType;
    switch (indentType)
    {
    case '\t': 
        return { insertSpaces: false };
    default: 
        return { insertSpaces: true, tabSize: indentType.length };
    }
}