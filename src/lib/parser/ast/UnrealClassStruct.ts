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
}