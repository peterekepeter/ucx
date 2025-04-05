import { ParserToken, SemanticClass, UnrealClass } from "../../parser";
import { UnrealClassVariable } from "../../parser/ast";
import { UnrealClassStatement } from "../../parser/ast/UnrealClassFunction";
import { SourceEditor } from "../SourceEditor";
import { SourceTransformer } from "../SourceTransformer";

export const foldConstants: SourceTransformer = (editor, uc) => {
    foldVariableDeclarations(editor, uc);
    foldFunctions(editor, uc);
};

function foldVariableDeclarations(editor: SourceEditor, uc: UnrealClass) {
    for (const variable of uc.variables){
        foldConstantsInVariableDeclaration(editor, variable, uc);
    }
}

function foldConstantsInVariableDeclaration(editor: SourceEditor, variable: UnrealClassVariable, uc: UnrealClass) 
{
    if (variable.arrayCountExpression == null || variable.arrayCount == null){
        return;
    }
    if ('text' in variable.arrayCountExpression){
        const token = variable.arrayCountExpression;
        if (token.type === SemanticClass.VariableReference)
        {
            replaceTokenWithConstantValue(editor, token, uc);
        }
        return;
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

function replaceTokenWithConstantValue(editor: SourceEditor, token: ParserToken, uc: UnrealClass)
{
    for (let constant of uc.constants){
        if (!constant.name || !constant.value) {
            return;
        }
        if (constant.name.textLower === token.textLower)
        {
            editor.replace(token.line, token.position, token.text.length, constant.value.text);
            break;
        }
    }
}

function foldFunctions(editor: SourceEditor, uc: UnrealClass) {
    for (const fn of uc.functions)
    {
        for (const st of fn.body){
            foldStatement(editor, uc, st);
        }
        for (const local of fn.locals){
            
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

