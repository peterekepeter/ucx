import { ParserToken, SemanticClass as C } from "../token";

export class ExpressionSplitter 
{
    private tokens: ParserToken[] = [];
    private lastWasTerm = false;
    

    getTokens(): ParserToken[] {
        return this.tokens;
    }

    addToken(token: ParserToken) {
        this.tokens.push(token);
        this.lastWasTerm = this.isTerm(token);
    }

    canContinueWithToken(token: ParserToken): boolean {
        switch (token.text){
        case ';':
        case '}':
        case '{':
            // these tokens can never be part of expressions 
            // and always breaks them
            return false;
        }
        if (this.lastWasTerm){
            return token.type !== C.Identifier;
        }
        else {
            return true;
        }
    }
    
    clear(){
        this.tokens = [];
        this.lastWasTerm = false;
    }
    
    private isTerm(token: ParserToken): boolean {
        switch (token.type) {
        case C.Identifier:
        case C.LiteralName:
        case C.LiteralNumber:
        case C.LiteralString:
            return true;
        }
        if (token.text === ')'){
            return true;
        }
        return false;
    }
}