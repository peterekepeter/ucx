import { SourceTransformer } from "../SourceTransformer";


export const replaceArrayCountExpressionWithLiteral: SourceTransformer = (editor, uc) => {
    for (const variable of uc.variables){
        if (variable.arrayCountExpression == null || variable.arrayCount == null){
            continue;
        }
        if ('text' in variable.arrayCountExpression){
            continue;
        }
        const expression = variable.arrayCountExpression;
        if (expression.op && 
            expression.argsLastToken && 
            expression.op.textLower === 'arraycount'
        ){
            const closingParenthesis = expression.argsLastToken?.position ?? 0;
            const line = expression.op?.line;
            const position = expression.op?.position ?? 0;
            const length = closingParenthesis - position + 1;
            editor.replace(line, position, length, String(variable.arrayCount));
        }

    }
};