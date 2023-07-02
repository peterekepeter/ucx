import { ParserToken as Token } from "..";
import { UnrealClassExpression } from "./UnrealClassFunction";

export interface UnrealClassVariable {
    type: Token | null;
    name: Token | null;
    isTransient: boolean;
    isConst: boolean;
    isEditConst: boolean;
    group: Token | null;
    isConfig: boolean;
    isPrivate: boolean;
    isNative: boolean;
    isInput: boolean;
    isTravel: boolean;
    isExport: boolean;
    firstToken: Token | null;
    lastToken: Token | null;
    arrayCountToken: Token | null;
    arrayCountExpression: Token | UnrealClassExpression | null;
    arrayCount: number | null;
    localized: boolean;
    template: Token | null;
}

export function createEmptyUnrealClassVariable(): UnrealClassVariable {
    return {
        name: null,
        type: null,
        isPrivate: false,
        isEditConst: false,
        isConst: false,
        isTransient: false,
        isNative: false, 
        isInput: false,
        isExport: false,
        isTravel: false,
        group: null,
        isConfig: false,
        firstToken: null,
        lastToken: null,
        arrayCount: null,
        arrayCountToken: null,
        localized: false,
        template: null,
        arrayCountExpression: null,
    };
}