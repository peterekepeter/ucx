import { ParserToken as Token } from "..";
import { UnrealClassFunction, UnrealClassStatement } from "./UnrealClassFunction";


export interface UnrealClassState {
    name: Token | null;
    functions: UnrealClassFunction[];
    body: UnrealClassStatement[];
    ignores: Token[];
    parentStateName: Token | null;
    bodyFirstToken: Token | null;
    bodyLastToken: Token | null;
}

export function createDefaultUnrealClassState(): UnrealClassState { 
    return {
        name: null,
        functions: [],
        body: [],
        ignores: [],
        parentStateName: null,
        bodyFirstToken: null,
        bodyLastToken: null,
    };
}
