import { AstIndentRule } from "./AstIndentRule";
import { EmptyLineBeforeFunction } from "./EmptyLineBeforeFunction";

export const ALL_AST_RULES = [
    new AstIndentRule(),
    new EmptyLineBeforeFunction()
];
