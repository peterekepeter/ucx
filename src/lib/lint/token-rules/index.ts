import { IndentationType } from "../indentation/IndentationType";
import { ParserToken } from "../../parser";
import { LintResult } from "../LintResult";
import { TokenBasedLinterV2 } from "../TokenBasedLinter";
import { BracketSpacingRule } from "./BracketSpacingRule";
import { KeywordCasingRule } from "./KeywordCasingRule";
import { ValidateNamesRule } from "./ValidateNamesRule";
import { ValidateStringRule } from "./ValidateStringRule";


export type TokenBasedLinterConfiguration = typeof DEFAULT_TOKEN_BASED_LINTER_CONFIGURATION;

export const DEFAULT_TOKEN_BASED_LINTER_CONFIGURATION = {
    enableBracketSpacingRule: true,
    enableValidateStringRule: true,
    enableValidateNamesRule: true,
    enableKeywordCasingRule: true,
    indentType: '\t' as IndentationType,
};

export function buildTokenBasedLinter(partialConfig?: Partial<TokenBasedLinterConfiguration>): TokenBasedLinterV2 {
    return new ComposedLinter([
        ...configureChildren({
            ...DEFAULT_TOKEN_BASED_LINTER_CONFIGURATION,
            ...partialConfig,
        })
    ]);
}

class ComposedLinter implements TokenBasedLinterV2
{
    constructor(private subLinters: TokenBasedLinterV2[]){}
    
    nextToken(token: ParserToken, textLines: string[]) {
        let result: LintResult[] | null = null;
        for (const child of this.subLinters){
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
}

function* configureChildren(config: TokenBasedLinterConfiguration): Iterable<TokenBasedLinterV2> {
    const c = config;
    if (c.enableBracketSpacingRule) { yield new BracketSpacingRule(c.indentType) }
    if (c.enableValidateStringRule) { yield new ValidateStringRule() }
    if (c.enableValidateNamesRule) { yield new ValidateNamesRule() }
    if (c.enableKeywordCasingRule) { yield new KeywordCasingRule() }
}
