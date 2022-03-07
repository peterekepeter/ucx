import { TokenBasedLinterV2 } from "../TokenBasedLinter";
import { BracketSpacingRule } from "./BracketSpacingRule";
import { KeywordFormatRule } from "./KeywordFormatRule";
import { NoneFormatRule } from "./NoneFormatRule";
import { TrueFalseFormatRule } from "./TrueFalseFormatRule";
import { ValidateNamesRule } from "./ValidateNamesRule";
import { ValidateStringRule } from "./ValidateStringRule";


export const ALL_V2_TOKEN_RULES: TokenBasedLinterV2[] = [
    new KeywordFormatRule(),
    new NoneFormatRule(),
    new TrueFalseFormatRule(),
    new BracketSpacingRule(),
    new ValidateStringRule(),
    new ValidateNamesRule(),
];