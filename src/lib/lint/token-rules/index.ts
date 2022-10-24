import { LintResult } from "../LintResult";
import { TokenBasedLinterV2 } from "../TokenBasedLinter";
import { BracketSpacingRule } from "./BracketSpacingRule";
import { KeywordFormatRule } from "./KeywordFormatRule";
import { NoneFormatRule } from "./NoneFormatRule";
import { TrueFalseFormatRule } from "./TrueFalseFormatRule";
import { ValidateNamesRule } from "./ValidateNamesRule";
import { ValidateStringRule } from "./ValidateStringRule";


export type TokenBasedLinterConfiguration =
{
    enableKeywordFormatRule: boolean
    enableNoneFormatRule: boolean
    enableTrueFalseFormatRule: boolean
    enableBracketSpacingRule: boolean
    enableValidateStringRule: boolean
    enableValidateNamesRule: boolean
};

export const DEFAULT_TOKEN_BASED_LINTER_CONFIGURATION: TokenBasedLinterConfiguration = {
    enableKeywordFormatRule: true,
    enableNoneFormatRule: true,
    enableTrueFalseFormatRule: true,
    enableBracketSpacingRule: true,
    enableValidateStringRule: true,
    enableValidateNamesRule: true,
};

export function buildTokenBasedLinter(partialConfig?: Partial<TokenBasedLinterConfiguration>): TokenBasedLinterV2 {
    
    const config = {
        ...DEFAULT_TOKEN_BASED_LINTER_CONFIGURATION,
        ...partialConfig,
    };

    const children: TokenBasedLinterV2[] = [];

    if (config.enableKeywordFormatRule) { children.push(new KeywordFormatRule()); }
    if (config.enableNoneFormatRule) { children.push(new NoneFormatRule()); }
    if (config.enableTrueFalseFormatRule) { children.push(new TrueFalseFormatRule()); }
    if (config.enableBracketSpacingRule) { children.push(new BracketSpacingRule()); }
    if (config.enableValidateStringRule) { children.push(new ValidateStringRule()); }
    if (config.enableValidateNamesRule) { children.push(new ValidateNamesRule()); }

    return {
        nextToken(token, textLines) {
            let result: LintResult[] | null = null;
            for (const child of children){
                const childResult = child.nextToken(token, textLines);
                if (childResult && childResult.length > 0)
                {
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