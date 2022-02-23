import { ParserToken as Token } from "..";
import { UnrealClassExpression } from "./UnrealClassFunction";


export interface UnrealClassConstant {
    name: Token | null;
    value: Token | null;
}


export interface UnrealDefaultProperty {
    arrayIndex: Token | null;
    name: Token | null;
    value: UnrealClassExpression | Token | null;
}
