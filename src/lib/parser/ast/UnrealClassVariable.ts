import { ParserToken as Token } from "..";

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
    arrayCount: number | null;
    localized: boolean;
    template: Token | null;
}
