import { ucTokenizeLine } from "../../tokenizer";
import { LazyParserToken, ParserToken, SemanticClass } from "../token";
import { ExpressionSplitter } from "./ExpressionSplitter";

test('can create', () => {
    const splitter = new ExpressionSplitter();
    expect(splitter).toBeTruthy();
});

test('can add tokens', () => {
    const splitter = new ExpressionSplitter();
    for (const t of tokenize("x = 3")){
        if (splitter.canContinueWithToken(t)){
            splitter.addToken(t);
        }
    }
    expect(splitter.getTokens()).toMatchObject([{text:'x'},{text:'='},{text:'3'}]);
});

test('cannot continue expression with second identifier', () => {
    const splitter = new ExpressionSplitter();
    const [t1, t2] = tokenize("x x");
    expect(splitter.canContinueWithToken(t1)).toBe(true);
    splitter.addToken(t1);
    expect(splitter.canContinueWithToken(t2)).toBe(false);
});

test('splits multiple assignments', () => {
    parsing("t=a  a=b  b=t")
        .yieldsGroups([
            't=a',
            'a=b',
            'b=t',
        ]);
});

test('splits multiple assigments with constants', () => {
    parsing('a=3  b="test"')
        .yieldsGroups([
            'a=3',
            'b="test"',
        ]);
});

test('splits function calls', () => {
    parsing('log(a) log(b)')
        .yieldsGroups([
            'log(a)',
            'log(b)',
        ]);
});

test('splits function calls', () => {
    parsing('log(a) log(b)')
        .yieldsGroups([
            'log(a)',
            'log(b)',
        ]);
});

test('splits single line foreach statement', () => {
    parsing("foreach AllActors(class'PlayerStart',Dest) DoSomething(Dest)")
        .yieldsGroups([
            'foreach',
            "AllActors(class'PlayerStart',Dest)",
            "DoSomething(Dest)",
        ]);
});

test('splits single line foreach followed by if statement', () => {
    parsing("foreach AllActors(class'Teleporter',Tel) if(string(Tel.Tag)~=incomingName)")
        .yieldsGroups([
            'foreach',
            "AllActors(class'Teleporter',Tel)",
            "if(string(Tel.Tag)~=incomingName)",
        ]);
});

test('splits single line foreach followed by if statement', () => {
    parsing("foreach AllActors( class 'Projectile', A ) {")
        .yieldsGroups([
            'foreach',
            "AllActors(class'Projectile',A)",
            "{",
        ]);
});

test('does not split new operator', () => {
    parsing("a=new class'T' b=new class'T'")
        .yieldsGroups([
            // ignore the fact that it removes a space
            "a=newclass'T'",
            "b=newclass'T'",
        ]);
});

test('does not split new(self) operator', () => {
    parsing("a=new(self) class'T'")
        .yieldsGroups([
            // ignore the fact that it removes a space
            "a=new(self)class'T'",
        ]);
});

function parsing(str: string) {
    const splitter = new ExpressionSplitter();
    const tokens = tokenize(str);
    let result: string[] = [];
    for (const token of tokens){
        if (splitter.canContinueWithToken(token))
        {
            splitter.addToken(token);
        }
        else 
        {
            const words = splitter.getTokens().map(t=>t.text);
            result.push(words.join(''));
            splitter.clear();
            splitter.addToken(token);
        }
    }
    const words = splitter.getTokens().map(t=>t.text);
    result.push(words.join(''));
    splitter.clear();
    return {
        yieldsGroups: (expected: string[]) => {
            expect(result).toMatchObject(expected);
        }
    };
}

function tokenize(input: string): LazyParserToken[] {
    return ucTokenizeLine(input).map((t,i) => new LazyParserToken(0, t.position, t.text, i));
}