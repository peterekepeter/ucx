import { ParserToken as Token } from "..";
import { UnrealClassFunction, UnrealClassStatement } from "./UnrealClassFunction";


export interface UnrealClassState {
    name: Token | null;
    functions: UnrealClassFunction[];
    body: UnrealClassStatement[];
    bodyFirstToken: Token | null;
    bodyLastToken: Token | null;
}
