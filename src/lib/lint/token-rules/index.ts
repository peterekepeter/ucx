import { TokenBasedLinter, TokenBasedLinterV2 } from "../TokenBasedLinter";
import { BracketSpacingRule } from "./BracketSpacingRule";
import { IndentRule } from "./IndentRule";
import { KeywordFormatRule } from "./KeywordFormatRule";
import { NoneFormatRule } from "./NoneFormatRule";
import { TrueFalseFormatRule } from "./TrueFalseFormatRule";
import { ValidateNamesRule } from "./ValidateNamesRule";
import { ValidateStringRule } from "./ValidateStringRule";

export const ALL_RULES: TokenBasedLinter[] = [
//    new KeywordFormatRule(),
//    new NoneFormatRule(),
//    new TrueFalseFormatRule(),
//    new IndentRule(),
//    new BracketSpacingRule(),
//    new ValidateNamesRule(),
    new ValidateStringRule()
];

export const ALL_V2_TOKEN_RULES: TokenBasedLinterV2[] = [
    new KeywordFormatRule()
];