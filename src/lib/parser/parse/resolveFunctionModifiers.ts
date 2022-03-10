import { Token } from "../types";
import { UnrealClassFunction } from "../ast/UnrealClassFunction";

export function resolveFunctionModifiers(modifiers: Token[]): Partial<UnrealClassFunction> {
    let isStatic = false;
    let isSimulated = false;
    let isFinal = false;
    for (const modifier of modifiers) {
        switch (modifier.textLower) {
            case "static":
                isStatic = true;
                break;
            case "simulated":
                isSimulated = true;
                break;
            case "final":
                isFinal = true;
                break;
        }
    }
    return {
        isStatic,
        isSimulated,
        isFinal
    };
}
