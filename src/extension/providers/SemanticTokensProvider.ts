import { SemanticClass } from "../../lib/parser";
import { db } from "../state";
import { vscode } from "../vscode";


export class SemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {

    legend: vscode.SemanticTokensLegend;
    keywordToken: number;
    commentToken: number;
    variableToken: number;
    propetyToken: number;
    enumMemberToken: number;
    enumToken: number;
    classToken: number;
    structToken: number;
    typeToken: number;
    operatorToken: number;
    stringToken: number;
    numberToken: number;
    functionToken: number;
    macroToken: number;
    labelToken: number;
    modifierDeclarationToken: number;
    readonlyToken: number;
    types: string[];
    modifiers: string[];

    constructor() {

        // https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide
        this.types = [
            'namespace',
            'class',
            'enum',
            'interface',
            'struct',
            'typeParameter',
            'type',
            'parameter',
            'variable',
            'property',
            'enumMember',
            'decorator',
            'event',
            'function',
            'method',
            'macro',
            'label',
            'comment',
            'string',
            'keyword',
            'number',
            'regexp',
            'operator', // 	For tokens that represent an operator.
        ];

        this.modifiers = [
            'declaration',
            'definition',
            'readonly',
            'static',
            'deprecated',
            'abstract',
            'async',
            'modification',
            'documentation',
            'defaultLibrary', //    For symbols that are part of the standard library.
        ];

        this.keywordToken = this.types.indexOf('keyword');
        this.commentToken = this.types.indexOf('comment');
        this.variableToken = this.types.indexOf('variable');
        this.propetyToken = this.types.indexOf('property');
        this.enumMemberToken = this.types.indexOf('enumMember');
        this.enumToken = this.types.indexOf('enum');
        this.classToken = this.types.indexOf('class');
        this.structToken = this.types.indexOf('struct');
        this.typeToken = this.types.indexOf('type');
        this.operatorToken = this.types.indexOf('operator');
        this.stringToken = this.types.indexOf('string');
        this.numberToken = this.types.indexOf('number');
        this.functionToken = this.types.indexOf('method');
        this.macroToken = this.types.indexOf('macro');
        this.labelToken = this.types.indexOf('label');
        this.modifierDeclarationToken = this.modifiers.indexOf('declaration');
        this.readonlyToken = this.modifiers.indexOf('readonly');

        this.legend = new vscode.SemanticTokensLegend(this.types, this.modifiers);
    }

    provideDocumentSemanticTokens(document: vscode.TextDocument, ctoken: vscode.CancellationToken) {
        const ast = db.updateDocumentAndGetAst(document, ctoken);
        const tokensBuilder = new vscode.SemanticTokensBuilder(this.legend);
        // on line 1, characters 1-5 are a class declaration
        for (const token of ast.tokens) {
            let type: number | undefined = undefined;
            let modifier: number | undefined = undefined;
            switch (token.type) {
            case SemanticClass.Comment:
                type = this.commentToken;
                break;
            case SemanticClass.ModifierKeyword:
            case SemanticClass.Keyword:
                type = this.keywordToken;
                break;
            case SemanticClass.StructMember:
            case SemanticClass.StructMemberDeclaration:
                type = this.propetyToken;
                modifier = this.modifierDeclarationToken;
                break;
            case SemanticClass.ClassVariable:
                type = this.propetyToken;
                break;
            case SemanticClass.EnumMember:
                type = this.enumMemberToken;
                break;
            case SemanticClass.EnumDeclaration:
                type = this.enumToken;
                modifier = this.modifierDeclarationToken;
                break;
            case SemanticClass.StructDeclaration:
                type = this.structToken;
                modifier = this.modifierDeclarationToken;
                break;
            case SemanticClass.ClassDeclaration:
                type = this.classToken;
                modifier = this.modifierDeclarationToken;
                break;
            case SemanticClass.ClassReference:
                type = this.classToken;
                break;
            case SemanticClass.TypeReference:
                type = this.typeToken;
                break;
            case SemanticClass.Operator:
            case SemanticClass.AssignmentOperator:
                type = this.operatorToken;
                break;
            case SemanticClass.ClassConstant:
                type = this.propetyToken;
                modifier = this.readonlyToken;
                break;
            case SemanticClass.ObjectReferenceName:
                type = this.stringToken;
                break;
            case SemanticClass.LiteralName:
                type = this.stringToken;
                break;
            case SemanticClass.LiteralString:
                // skip, tmGrammer has better highlight for escapes
                // type = TOKEN_TYPE_STRING;
                break;
            case SemanticClass.LiteralNumber:
                type = this.numberToken;
                break;
            case SemanticClass.FunctionDeclaration:
                modifier = this.modifierDeclarationToken;
            case SemanticClass.FunctionReference:
                type = this.functionToken;
                break;
            case SemanticClass.LocalVariable:
                type = this.variableToken;
                break;
            case SemanticClass.VariableReference:
                type = this.variableToken;
                break;
            case SemanticClass.ExecInstruction:
                // skip this until tmGrammar has proper syntax
                // type = TOKEN_TYPE_MACRO;
                break;
            case SemanticClass.LanguageConstant:
                // skip for now, tmGrammar identifies this type of constant
                // type = TOKEN_TYPE_KEYWORD;
                break;
            case SemanticClass.StatementLabel:
                type = this.labelToken;
                break;
            }
            if (type !== undefined) {
                tokensBuilder.push(
                    token.line, token.position, token.text.length, type, modifier
                );
            }
        }
        return tokensBuilder.build();
    }

}
