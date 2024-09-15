import { ParserToken } from "../token";
import { UnrealClass } from "./UnrealClass";
import { UnrealClassExpression, UnrealClassFunction, UnrealClassStatement } from "./UnrealClassFunction";

/** @returns all statements including from states and state functions */
export function *getAllClassStatements(ast: UnrealClass): Iterable<UnrealClassStatement> {
    for (const fn of getAllClassFunctions(ast)){
        for (const st of getStatementsRecursively(fn.body))
        {
            yield st;
        }
    }
    for (const state of ast.states){
        for (const st of getStatementsRecursively(state.body)){
            yield st;
        }
    }
}

/** @returns all declared functions including state functions */
export function *getAllClassFunctions(ast: UnrealClass): Iterable<UnrealClassFunction> 
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

export function *getStatementsRecursively(sts: UnrealClassStatement[]): Iterable<UnrealClassStatement>{
    for (const st of sts) {
        yield st;
        if (st.body && st.body.length > 0) {
            for (const sub of getStatementsRecursively(st.body)) {
                yield sub;
            }
        }
    }
}

export function *getExpressionTokensRecursively(expression: UnrealClassExpression): Iterable<ParserToken> {
    if (expression.op) {
        yield expression.op;
    }
    if (expression.args) {
        for (const arg of expression.args) {
            if ('op' in arg) {
                for (const tok of getExpressionTokensRecursively(arg)) {
                    yield tok;
                }
            }
            else {
                yield arg;
            }
        }
    }
}
