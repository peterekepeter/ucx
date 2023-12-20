import { ParserToken, UnrealClass, isTokenAtOrBetween } from "../parser";
import { UnrealClassFunction, UnrealClassFunctionArgument, UnrealClassFunctionLocal, UnrealClassVariable } from "../parser/ast";

export type TokenInformation = {
    found?: boolean,
    missingAst?: boolean,
    token?: ParserToken,
    ast?: UnrealClass,
    uri?: string,
    functionScope?: UnrealClassFunction
    localDefinition?: UnrealClassFunctionLocal,
    paramDefinition?: UnrealClassFunctionArgument,
    varDefinition?: UnrealClassVariable,
    fnDefinition?: UnrealClassFunction,
    classDefinition?: UnrealClass,
};

export class ClassDatabase
{
    findToken(uri: string, line: number, character: number): TokenInformation {
        const entry = this.store[uri];
        if (!entry) return { uri, missingAst: true };
        const ast = entry.ast;
        let token: ParserToken | undefined;
        for (const t of ast.tokens) {
            if (t.line === line) {
                if (t.position <= character && character < t.position + t.text.length) {
                    token = t;
                    break;
                }
            }
        }
        if (!token) return { uri, found: false };
        let functionScope: UnrealClassFunction | undefined;
        for (const fn of ast.functions) {
            const from = fn.name ?? fn.fnArgsFirstToken ?? fn.bodyFirstToken;
            const to = fn.bodyLastToken ?? fn.fnArgsLastToken ?? fn.name;
            if (from && to && isTokenAtOrBetween(token, from, to)) {
                functionScope = fn;
                break;
            }
        }
        return { uri, found: true, token, ast, functionScope };
    }
    
    findLocalFileDefinition(query: TokenInformation): TokenInformation {
        let result: TokenInformation|undefined;
        if (!query.token) return { found: false };
        if (!query.ast) return { missingAst: true };
        if (query.functionScope) {
            result = this.findFunctionLocalDefinition(query);
        }
        if (!result && query.ast) {
            result = this.findClassLocalDefinition(query, query.token.textLower, query.ast);
        }
        if (query.token.textLower === query.ast.name?.textLower) {
            result = {
                token: query.ast.name,
                classDefinition: query.ast,
            };
        }
        if (result?.token) {
            result.found = true;
            result.ast = query.ast;
            result.uri = query.uri;
            return result;
        }
        return { found: false };
    }

    private findFunctionLocalDefinition(q: TokenInformation) {
        let result: TokenInformation|undefined;
        if (!q.functionScope || !q.token) return;
        result = this.findFunctionLocalDefinitionStr(q.token.textLower, q.functionScope);
        if (result?.token) {
            result.found = true;
            result.functionScope = q.functionScope;
        }
        return result;
    }

    private findFunctionLocalDefinitionStr(nameLower: string, fn: UnrealClassFunction){
        for (const param of fn.fnArgs) 
            if (param.name?.textLower === nameLower) 
                return { token: param.name, paramDefinition: param };
        for (const local of fn.locals) 
            if (local.name?.textLower === nameLower)
                return { token: local.name, localDefinition: local, };
    }

    private findClassLocalDefinition(query: TokenInformation, name: string, ast: UnrealClass): TokenInformation|undefined {
        for (const variable of ast.variables) 
            if (variable.name?.textLower === name) 
                return {
                    found: true,
                    token: variable.name,
                    varDefinition: variable,
                };
        for (const fn of ast.functions)
            if (fn.name?.textLower === name)
                return { token: fn.name, fnDefinition: fn };
    }
    
    findCrossFileDefinition(query: TokenInformation): TokenInformation {
        if (query.token && query.ast) {
            if (query.token === query.ast.parentName) {
                // looking for parent definition
                return this.findClassDefinition(query.token.textLower);
            }
        }
        return { found: false };
    }

    findClassDefinition(textLower: string): TokenInformation  {
        for (const uri in this.store) {
            const entry = this.store[uri];
            const ast = entry.ast;
            if (ast.name?.textLower === textLower) {
                return { found: true, uri, ast, classDefinition: ast, token: ast.name };
            }
        }
        return { found: false };
    }

    updateAst(uri: string, ast: UnrealClass, version: number) {
        if (!this.store[uri]) 
        {
            this.store[uri] = { ast, version };
        }
        else {
            const entry = this.store[uri];
            if (entry.version >= version) return;
            entry.ast = ast;
            entry.version = version;
        }
    }

    getVersion(uri: string): number {
        return this.store[uri]?.version ?? -Infinity;
    }

    store: Record<string, {
        ast: UnrealClass; 
        version: number
    }> = {};
}