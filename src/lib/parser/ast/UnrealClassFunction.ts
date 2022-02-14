import { ParserToken } from "../types";


export interface UnrealClassFunction {
    name: ParserToken | null;
    locals: UnrealClassFunctionLocal[];
    body: UnrealClassStatement[];
    bodyFirstToken: ParserToken | null;
    bodyLastToken: ParserToken | null;
}

export interface UnrealClassFunctionLocal {
    type: ParserToken | null;
    name: ParserToken | null;
}

export interface UnrealClassExpression {
    op: ParserToken | null;
    args: (UnrealClassExpression | ParserToken)[];
}

export interface UnrealClassStatement extends UnrealClassExpression {
    argsFirstToken: ParserToken | null;
    argsLastToken: ParserToken | null;
    body: UnrealClassStatement[];
    bodyFirstToken: ParserToken | null;
    bodyLastToken: ParserToken | null;
}
