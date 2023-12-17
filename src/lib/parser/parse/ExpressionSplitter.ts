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
        if (this.tokens.length !== 0) {
            const lastToken = this.tokens[this.tokens.length-1];
            if (lastToken.text === ':') {
                return false; // cannot continue after colon
            }
            switch (token.textLower)
            {
            case 'case': 
            case 'default': 
                if (lastToken.text !== '.') {
                    return false; // case/default inside switch 
                }
            }
        }
        if (this.lastWasTerm){
            if (this.tokens.length > 0)
            {
                const l = this.tokens.length;
                if (this.tokens[l - 1].text === ')')
                {
                    for (let i = l - 2; i > 0; i-=1) {
                        if (this.tokens[i].text === '(' &&
                            this.tokens[i - 1].textLower === 'new')
                        {
                            // it is! allow continuation with term
                            return this.isTerm(token);
                        }
                    }
                }
            }
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