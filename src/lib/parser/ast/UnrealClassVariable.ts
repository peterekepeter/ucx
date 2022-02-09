import { ParserToken } from "../types";


export interface UnrealClassVariable {
    type: ParserToken | null;
    name: ParserToken | null;
    isTransient: boolean;
    isConst: boolean;
    group: ParserToken | null;
    isConfig: boolean;
    firstToken: ParserToken;
    lastToken: ParserToken;
}
