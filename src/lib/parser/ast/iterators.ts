import { ParserToken } from "../token";
import { UnrealClass } from "./UnrealClass";
import { UnrealClassExpression, UnrealClassFunction, UnrealClassStatement } from "./UnrealClassFunction";

/** @returns all statements including from states and state functions */
export function *getAllStatements(ast: UnrealClass): Iterable<UnrealClassStatement> {
    for (const fn of getAllFunctions(ast)){
        for (const st of getAllBodyStatements(fn.body))
        {
            yield st;
        }
    }
    for (const state of ast.states){
        for (const st of getAllBodyStatements(state.body)){
            yield st;
        }
    }
}

export function *getAllBodyStatements(sts: UnrealClassStatement[]): Iterable<UnrealClassStatement>{
    for (const st of sts) {
        yield st;
        if (st.body && st.body.length > 0) {
            for (const sub of getAllBodyStatements(st.body)) {
                yield sub;
            }
        }
    }
}

/** @returns all declared functions including state functions */
export function *getAllFunctions(ast: UnrealClass): Iterable<UnrealClassFunction> 
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

/** @returns all statement tokens */
export function *getAllStatementTokens(stOrExp: UnrealClassStatement|UnrealClassExpression): Iterable<ParserToken> {
    if (stOrExp.op) {
        yield stOrExp.op;
    }
    if (stOrExp.args) {
        for (const arg of stOrExp.args) {
            if ('op' in arg) {
                for (const tok of getAllStatementTokens(arg)) {
                    yield tok;
                }
            }
            else {
                yield arg;
            }
        }
    }
    if ('body' in stOrExp) {
        for (const child of stOrExp.body) {
            for (const tok of getAllStatementTokens(child)) {
                yield tok;
            }
        }
    }
}