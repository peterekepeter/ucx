import { UnrealClass } from "../ast";
import { UnrealClassVariable } from "../ast/UnrealClassVariable";
import { SemanticClass } from "../token";



export function resolveArrayCountExpressions(ast: UnrealClass)
{
    for (const variable of ast.variables)
    {
        resolveSingle(ast, variable);
    }
}

function resolveSingle(ast: UnrealClass, variable: UnrealClassVariable) {
    if (variable.arrayCount != null){
        return; // no need
    }
    const expression = variable.arrayCountExpression;
    if (expression == null)
    {
        return; // not array type
    }
    if ('text' in expression)
    {
        // is token
        variable.arrayCount = Number.parseInt(expression.text);
        return;
    }
    if (expression.op?.textLower === 'arraycount' &&
        expression.args.length === 1){
        const arg = expression.args[0];
        if ('text' in arg){
            // arg is basic token
            if (arg.type === SemanticClass.VariableReference ||
                arg.type === SemanticClass.Identifier){
                // arg refers to another variable
                const varname = arg.textLower;
                for (const otherVar of ast.variables){
                    if (otherVar.name?.textLower === varname){
                        // match!
                        if (otherVar.arrayCount != null && otherVar.arrayCountExpression != null){
                            if (otherVar.arrayCount == null){
                                resolveSingle(ast, otherVar);
                            }
                            variable.arrayCount = otherVar.arrayCount;
                        }
                    }
                }
            }
        }

    }
}
