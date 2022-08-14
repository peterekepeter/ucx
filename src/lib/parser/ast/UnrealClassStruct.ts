import { Token } from "../types";
import { UnrealClassVariable } from "./UnrealClassVariable";


export interface UnrealClassStruct
{
    name: Token | null;
    firstToken: Token;
    lastToken: Token;
    bodyFirstToken: Token | null;
    bodyLastToken: Token | null;
    members: UnrealClassVariable[];
    parentName: Token | null;
}

export function createEmptyStruct(token: Token): UnrealClassStruct {
    return {
        name: null,
        firstToken: token,
        lastToken: token,
        members: [],
        bodyFirstToken: null,
        bodyLastToken: null,
        parentName: null,
    };
}