import { UnrealClass } from "../../parser";
import { UnrealClassStatement } from "../../parser/ast/UnrealClassFunction";
import { SourceEditor } from "../SourceEditor";
import { SourceTransformer } from "../SourceTransformer";


export const foldConstants: SourceTransformer = (editor, uc) => {
    foldVariableDeclarations(editor, uc);
    foldFunctions(editor, uc);
};

function foldVariableDeclarations(editor: SourceEditor, uc: UnrealClass) {
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
}

function foldFunctions(editor: SourceEditor, uc: UnrealClass) {
    for (const fn of uc.functions)
    {
        for (const st of fn.body){
            foldStatement(editor, uc, st);
        }
    }
}

function foldStatement(editor: SourceEditor, uc: UnrealClass, st: UnrealClassStatement) {
    for (const expr of st.args){
        foldExpr(editor, uc, expr);
    }
    for (const childSt of st.body){
        foldStatement(editor, uc, childSt);
    }
}

function foldExpr(editor: SourceEditor, uc: UnrealClass, expr: import("../../parser/ast/UnrealClassFunction").UnrealClassExpression | import("../../parser").ParserToken) {
    if ('text' in expr)
    {
        // is token
        return;
    }
    if (expr.op?.textLower === 'arraycount'){
        const closingParenthesis = expr.argsLastToken?.position ?? 0;
        const line = expr.op?.line;
        const position = expr.op?.position ?? 0;
        const length = closingParenthesis - position + 1;
        // find var
        const name = expr.args[0];
        if ('text' in name){
            for (const variable of uc.variables){
                if (variable.name?.textLower === name.textLower)
                {
                    // found
                    editor.replace(line, position, length, `${variable.arrayCount}`);
                }
            }
        }

    }
    else {
        for (const subexpr of expr.args) {
            foldExpr(editor, uc, subexpr);
        }
    }
}

