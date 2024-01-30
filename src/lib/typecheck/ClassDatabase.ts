import { ParserToken, SemanticClass, UnrealClass, isTokenAtOrBetween } from "../parser";
import { UnrealClassFunction, UnrealClassFunctionArgument, UnrealClassFunctionLocal, UnrealClassVariable, getAllFunctions, getAllStatements } from "../parser/ast";

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
    store: Record<string, {
        ast: UnrealClass; 
        version: number
    }> = {};

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
        if (this.isTypeQuery(query)) {
            // looking for a type in this file
            return { found: false }; // HACK assume types are always across files
        }
        if (query.functionScope) {
            result = this.findFunctionScopedSymbol(query);
        }
        if (!result && query.ast) {
            result = this.findClassScopedSymbol(query.token.textLower, query.ast);
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

    findCrossFileDefinition(query: TokenInformation): TokenInformation {
        if (query.token && query.ast) {
            if (this.isTypeQuery(query)) {
                // looking for parent definition
                return this.findClassDefinitionForQueryToken(query);
            }
            if (this.isMemberQuery(query)) {
                return this.findMemberDefinitionForQueryToken(query);
            }
            // look for symbol in parent class
            let location: TokenInformation | undefined = query;
            let symbolName = query.token?.textLower;
            while (location?.ast?.parentName) {
                location = this.findClassDefinitionStr(location.ast.parentName.textLower);
                if (!location.found || !location.ast) break;
                const symbol = this.findClassScopedSymbol(symbolName, location.ast);
                if (symbol?.token) {
                    symbol.found = true;
                    symbol.uri = location.uri;
                    symbol. ast = location.ast;
                    return symbol;
                }
            }
            // maybe its a typecast to another class
            const classdef =this.findClassDefinitionForQueryToken(query);
            if (classdef.found) {
                return classdef;
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

    getAst(uri: string): UnrealClass|undefined {
        return this.store[uri]?.ast;
    }

    private isMemberQuery(query: TokenInformation) {
        if (!query.token || !query.ast) return false;
        const index = query.ast.tokens.indexOf(query.token);
        return this.isMemberToken(query.ast.tokens, index);
    }

    private isMemberToken(tokens: ParserToken[], index: number) {
        if (index > 0) {
            const before = tokens[index-1];
            if (before.text === ".") {
                return true;
            }
        }
    }

    private findMemberDefinitionForQueryToken(query: TokenInformation): TokenInformation {
        if (!query.token || !query.ast) return { found: false };
        const tokens = query.ast.tokens;
        let index = tokens.indexOf(query.token);
        const chain = this.getMemberChain(tokens, index);

        let type: TokenInformation|null = null;
        let member: TokenInformation|null = null;
        for (const item of chain) {
            if (item.text === ')') 
            {
                // is using result of function call or typecast
                // find matching paren
                const tokens = query.ast.tokens;
                let count = 1;
                let found = false;
                for (let i = 1; i<item.index; i+=1) {
                    const prev = tokens[item.index-i];
                    if (prev.text === ')') count += 1;
                    if (prev.text === '(') {
                        count -= 1;
                        if (count === 0) {
                            const fn = tokens[item.index - i - 1];
                            const subquery = { ...query, token: fn };
                            member = this.findDefinition(subquery);
                            if (!member.found) {
                                member = this.findClassDefinitionStr(fn.textLower);
                            }
                            found = true;
                            break;
                        }
                    }
                }
                if (found) {
                    continue;
                }
            }
            
            if (item.type === SemanticClass.Keyword && 
                (item.textLower === 'static' || item.textLower === 'default')) {
                continue;
            }
            const itemQuery: TokenInformation = {
                token: item,
                ast: query.ast,
                functionScope: query.functionScope,
                uri: query.uri, 
            };
            if (member){
                // look inside class of member
                if (member.classDefinition) {
                    // member already a class
                    type = member;
                }
                else {
                    type = this.findTypeDefinition(member);
                }
                member = null;
            }
            if (type) {
                member = this.findMemberDefinition(type, itemQuery);
            } else {
                member = this.findDefinition(itemQuery);
            }
        }
        if (member) {
            return member;
        }
        return { found: false };
    }

    findDefinition(itemQuery: TokenInformation): TokenInformation {
        const localResult = this.findLocalFileDefinition(itemQuery);
        if (localResult.found) return localResult;
        return this.findCrossFileDefinition(itemQuery);
    }

    findMemberDefinition(typeDefinition: TokenInformation, memberReference: TokenInformation): TokenInformation {
        if (!typeDefinition.ast) return { found: false };
        for (const fn of typeDefinition.ast.functions) {
            if (fn.name && fn.name?.textLower === memberReference.token?.textLower) {
                return {
                    token: fn.name,
                    ast: typeDefinition.ast,
                    uri: typeDefinition.uri,
                    fnDefinition: fn,
                    found: true,
                };
            }
        }
        for (const v of typeDefinition.ast.variables) {
            if (v.name && v.name.textLower === memberReference.token?.textLower) {
                return {
                    token: v.name,
                    ast: typeDefinition.ast,
                    uri: typeDefinition.uri,
                    varDefinition: v,
                    found: true,
                };
            }
        }
        return { found: false };
    }

    findTypeDefinition(d: TokenInformation): TokenInformation {
        if (d.fnDefinition) {
            return this.findDefinition({
                token: d.fnDefinition.name ?? undefined,
                ast: d.ast,
                uri: d.uri,
            });
        }
        if (d.paramDefinition) {
            return this.findDefinition({
                token: d.paramDefinition.type ?? undefined,
                ast: d.ast,
                uri: d.uri,
                functionScope: d.functionScope,
            });
        }
        if (d.varDefinition && d.varDefinition.type) {
            return this.findDefinition({
                token: d.varDefinition.type,
                ast: d.ast, 
                uri: d.uri, 
            });
        }
        return { found: false };
    }

    private getMemberChain(tokens: ParserToken[], index: number) 
    {
        const stack = [tokens[index]];
        while (index > 1) {
            if (!this.isMemberToken(tokens, index)) break;
            stack.push(tokens[index - 2]);
            index -= 2;
        }
        const chain = stack.reverse();
        return chain;
    }


    private findFunctionScopedSymbol(q: TokenInformation) {
        let result: TokenInformation|undefined;
        if (!q.functionScope || !q.token) return;
        result = this.findFunctionScopedSymbolStr(q.token.textLower, q.functionScope);
        if (result?.token) {
            result.found = true;
            result.functionScope = q.functionScope;
        }
        return result;
    }

    private findFunctionScopedSymbolStr(nameLower: string, fn: UnrealClassFunction){
        for (const param of fn.fnArgs) 
            if (param.name?.textLower === nameLower) 
                return { token: param.name, paramDefinition: param };
        for (const local of fn.locals) 
            if (local.name?.textLower === nameLower)
                return { token: local.name, localDefinition: local, };
    }

    private findClassScopedSymbol(name: string, ast: UnrealClass): TokenInformation|undefined {
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

    private findClassDefinitionForQueryToken(q: TokenInformation) {
        if (!q.token) return { found: false };
        if (q.token.textLower.startsWith("'")) {
            const quoted = q.token.textLower;
            const className = quoted.substring(1, quoted.length - 1);
            return this.findClassDefinitionStr(className);
        }
        else {
            return this.findClassDefinitionStr(q.token.textLower);
        }
    }

    private findClassDefinitionStr(classNameLower: string): TokenInformation  {
        let packageNameLower = '';
        if (classNameLower.indexOf('.')) {
            const parts = classNameLower.split('.');
            classNameLower = parts[parts.length - 1];
            packageNameLower = parts[0];
        }
        // TODO match pacage
        for (const uri in this.store) {
            const entry = this.store[uri];
            const ast = entry.ast;
            if (ast.name?.textLower === classNameLower) {
                return { found: true, uri, ast, classDefinition: ast, token: ast.name };
            }
        }
        return { found: false };
    }

    private isTypeQuery(q: TokenInformation): boolean {
        if (!q.token || !q.ast) return false;
        if (q.functionScope)
        {
            const fn = q.functionScope;
            if (q.token.textLower.startsWith("'")) {
                const idx = q.ast.tokens.indexOf(q.token);
                if (idx > 0) {
                    const before = q.ast.tokens[idx - 1];
                    if (before.textLower === 'class') {
                        return true;
                    }
                }
            }
            for (const arg of fn.fnArgs) {
                if (q.token === arg.type) {
                    return true;
                }
            }
            for (const local of fn.locals) {
                if (q.token === local.type) {
                    return true;
                }
            } 
        }
        else if (q.token === q.ast.parentName) {
            return true; // look for parent class
        }
        else {
            for (const v of q.ast.variables) {
                if (q.token === v.type) {
                    return true; // look for type of var def
                }
            }
            for (const fn of getAllFunctions(q.ast)) {
                if (q.token === fn.returnType) {
                    return true;
                }
            }
        }
        return false;
    }
}