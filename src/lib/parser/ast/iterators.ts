import { UnrealClass } from "./UnrealClass";
import { UnrealClassFunction, UnrealClassStatement } from "./UnrealClassFunction";

/** @returns all statements including from states and state functions */
export function *getAllStatements(ast: UnrealClass): Iterable<UnrealClassStatement> {
    for (const fn of getAllFunctions(ast)){
        for (const st of fn.body)
        {
            yield st;
        }
    }
    for (const state of ast.states){
        for (const st of state.body){
            yield st;
        }
    }
}

/** @returns all declared functions including state functions */
function *getAllFunctions(ast: UnrealClass): Iterable<UnrealClassFunction> 
{
    for (const fn of ast.functions)
    {
        yield fn;
    }
    for (const state of ast.states){
        for (const fn of state.functions){
            yield fn;
        }
    }
}