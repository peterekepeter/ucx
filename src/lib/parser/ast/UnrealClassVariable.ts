import { ParserToken as Token } from "..";
import { UnrealClassExpression } from "./UnrealClassFunction";

export interface UnrealClassVariable {
    type: Token | null;
    name: Token | null;
    isTransient: boolean;
    isConst: boolean;
    group: Token | null;
    isConfig: boolean;
    firstToken: Token;
    lastToken: Token;
    arrayCountToken: Token | null;
    arrayCountExpression: Token | UnrealClassExpression | null;
    arrayCount: number | null;
    localized: boolean;
    template: Token | null;
}
