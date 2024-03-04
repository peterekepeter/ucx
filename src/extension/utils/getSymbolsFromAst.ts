import { rangeFromTokens, rangeFromToken } from "./rangeFromToken";
import { UnrealClass } from "../../lib";
import { UnrealDefaultProperty } from "../../lib/parser/ast";
import { vscode } from "../vscode";

export function getSymbolsFromAst(ast: UnrealClass, uri: vscode.Uri): vscode.SymbolInformation[] {
    const result: vscode.SymbolInformation[] = []; 
    let mainContainer = '';
    if (ast.name) {
        result.push(new vscode.SymbolInformation(
            ast.name.text,
            vscode.SymbolKind.Class,
            "",
            new vscode.Location(uri, 
                rangeFromTokens(
                    ast.classDeclarationFirstToken ?? ast.name, 
                    ast.classDeclarationLastToken ?? ast.name
                ))
        ));
    }
    for (const constant of ast.constants) {
        if (!constant.name) { continue };
        result.push(new vscode.SymbolInformation(
            constant.name.text,
            vscode.SymbolKind.Constant,
            mainContainer,
            new vscode.Location(uri, rangeFromTokens(constant.name, constant.name))
        ));
    }
    for (const struct of ast.structs) {
        if (!struct.name) { continue };
        const structName = struct.name.text;
        result.push(new vscode.SymbolInformation(
            structName,
            vscode.SymbolKind.Struct,
            mainContainer,
            new vscode.Location(uri, rangeFromTokens(
                struct.name, struct.bodyLastToken ?? struct.name))
        ));
        for (const member of struct.members) {
            if (!member.name) { continue };
            result.push(new vscode.SymbolInformation(
                member.name.text,
                vscode.SymbolKind.Variable,
                structName,
                new vscode.Location(uri, rangeFromTokens(
                    member.firstToken ?? member.name, 
                    member.lastToken ?? member.name,
                ))
            ));
        }
    }
    for (const enumDeclaration of ast.enums){
        if (!enumDeclaration.name) { continue };
        const enumName = enumDeclaration.name;
        result.push(new vscode.SymbolInformation(
            enumDeclaration.name.text,
            vscode.SymbolKind.Enum,
            mainContainer,
            new vscode.Location(
                uri,
                rangeFromTokens(
                    enumDeclaration.firstToken, 
                    enumDeclaration.lastToken)
            )
        ));
        for (const enumItem of enumDeclaration.enumeration){
            result.push(new vscode.SymbolInformation(
                enumItem.text,
                vscode.SymbolKind.EnumMember,
                enumName.text, 
                new vscode.Location(
                    uri,
                    rangeFromTokens(enumItem, enumItem)
                )
            ));
        }
    }
    for (const varDeclaration of ast.variables){
        if (!varDeclaration.name) { continue };
        result.push(new vscode.SymbolInformation(
            varDeclaration.name.text,
            vscode.SymbolKind.Variable,
            mainContainer,
            new vscode.Location(
                uri,
                rangeFromTokens(varDeclaration.name, varDeclaration.name)
            )
        ));
    }
    for (const fnDecl of ast.functions) {
        if (!fnDecl.name) { continue };
        result.push(new vscode.SymbolInformation(
            fnDecl.name.text,
            fnDecl.isOperator ? vscode.SymbolKind.Operator : 
                fnDecl.isEvent ? vscode.SymbolKind.Event : 
                    fnDecl.isStatic ? vscode.SymbolKind.Function :
                        vscode.SymbolKind.Method,
            mainContainer,
            new vscode.Location(
                uri,
                rangeFromTokens(
                    fnDecl.name,
                    fnDecl.bodyLastToken ?? fnDecl.fnArgsLastToken ?? fnDecl.name)
            )
        ));
    }
    for (const state of ast.states) {
        const stateNameToken = state.name;
        if (!stateNameToken) { continue };
        const stateName = stateNameToken.text;
        result.push(new vscode.SymbolInformation(
            stateName,
            vscode.SymbolKind.Class,
            mainContainer,
            new vscode.Location(
                uri,
                rangeFromTokens(
                    stateNameToken,
                    state.bodyLastToken ?? stateNameToken,
                )
            )
        ));
        for (const fnDecl of state.functions) {
            if (!fnDecl.name) { continue };
            result.push(new vscode.SymbolInformation(
                fnDecl.name.text,
                vscode.SymbolKind.Function,
                stateName,
                new vscode.Location(
                    uri, 
                    rangeFromTokens(
                        fnDecl.name, fnDecl.bodyLastToken ?? fnDecl.fnArgsLastToken ?? fnDecl.name
                    )
                )
            ));
        }
    }
    if (ast.defaultPropertiesFirstToken && ast.defaultPropertiesLastToken) {
        const section = 'defaultproperties';
        result.push(new vscode.SymbolInformation( 
            section,
            vscode.SymbolKind.Namespace,
            mainContainer,
            new vscode.Location(
                uri,
                rangeFromTokens(
                    ast.defaultPropertiesFirstToken,
                    ast.defaultPropertiesLastToken
                )
            )
        ));
        if (ast.defaultProperties.length > 0) {
            let consecutiveFirstProp: UnrealDefaultProperty = ast.defaultProperties[0];
            let consecutiveLastProp: UnrealDefaultProperty = ast.defaultProperties[0];
            const emit = () => { 
                if (consecutiveFirstProp.name)
                {
                    result.push(new vscode.SymbolInformation( 
                        consecutiveFirstProp.name.text,
                        vscode.SymbolKind.Constant,
                        section,
                        new vscode.Location(
                            uri,
                            rangeFromTokens(
                                consecutiveFirstProp.name,
                                consecutiveLastProp.name ?? consecutiveFirstProp.name,
                            )
                        )
                    ));
                }
            };

            for (const defprop of ast.defaultProperties) {
                if (!defprop.name) { continue };
                if (consecutiveLastProp.name?.text === defprop.name?.text) {
                    consecutiveLastProp = defprop;
                    continue; 
                }
                else {
                    emit();
                    consecutiveFirstProp = defprop;
                    consecutiveLastProp = defprop;
                }
            }

            emit();

        }
    }
    for (const replication of ast.replicationBlocks) {
        const section = 'replication';
        result.push(new vscode.SymbolInformation(
            section,
            vscode.SymbolKind.Namespace,
            mainContainer,
            new vscode.Location(uri, rangeFromTokens(
                replication.firstToken,
                replication.lastToken
            ))
        ));
        for (const statement of replication.statements) {
            for (const target of statement.targets) {
                result.push(new vscode.SymbolInformation(
                    target.text,
                    vscode.SymbolKind.Null,
                    section,
                    new vscode.Location(uri, rangeFromToken(target))
                ));
            }
        }
    } 
    return result;
}