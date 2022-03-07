import { AstIndentRule } from "./AstIndentRule";
import { EmptyLineBeforeFunction } from "./EmptyLineBeforeFunction";
import { OperatorSpacing } from "./OperatorSpacing";

export const ALL_AST_RULES = [
    new AstIndentRule(),
    new EmptyLineBeforeFunction(),
    new OperatorSpacing()
];
