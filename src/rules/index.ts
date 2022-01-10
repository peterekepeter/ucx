import { BracketSpacingRule } from "./BracketSpacingRule";
import { IndentRule } from "./IndentRule";
import { KeywordFormatRule } from "./KeywordFormatRule";
import { NoneFormatRule } from "./NoneFormatRule";
import { TrueFalseFormatRule } from "./TrueFalseFormatRule";
import { ValidateNamesRule } from "./ValidateNamesRule";

export const ALL_RULES = [
    new KeywordFormatRule(),
    new NoneFormatRule(),
    new TrueFalseFormatRule(),
    new IndentRule(),
    new BracketSpacingRule(),
    new ValidateNamesRule()
];