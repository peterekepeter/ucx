import { SemanticClass as C } from "..";
import { getExpressionTokenType } from "./getExpressionTokenType";
import { LazyParserToken } from "./LazyParserToken";


test("numbers", () => {
    verify("42", C.LiteralNumber);
    verify("-42", C.LiteralNumber);
    verify("0.14", C.LiteralNumber);
    verify("0xFFAA", C.LiteralNumber);
});

test("string", () => {
    verify('"Test"', C.LiteralString);
});

test("name", () => {
    verify("'Test'", C.LiteralName);
});

test("default is none", () => {
    verify("", C.None);
});

test("identifier", () => {
    verify("maxValue", C.Identifier);
    verify("_member", C.Identifier);
    verify("x001", C.Identifier);
});

test("operators", () => {
    verify("+", C.Operator);
    verify("-", C.Operator);
    verify("*", C.Operator);
    verify("/", C.Operator);
    verify("<", C.Operator);
    verify(">", C.Operator);
    verify("<=", C.Operator);
    verify(">=", C.Operator);
    verify("++", C.Operator);
    verify("--", C.Operator);
    verify("==", C.Operator);
    verify("!=", C.Operator);
    verify("~=", C.Operator);
    verify("&&", C.Operator);
    verify("||", C.Operator);
    verify("!", C.Operator);
});

test("new is keyword", () => {
    verify("new", C.Operator);
});

test("language constants", () => {
    verify("None", C.LanguageConstant);
    verify("True", C.LanguageConstant);
    verify("False", C.LanguageConstant);
});


test("lazy token properties", () => {
    const token = new LazyParserToken(13, 4, "Help", 42);
    expect(token).toMatchObject({
        line: 13, 
        position: 4, 
        index: 42,
        text: "Help",
        textLower: "help",
        type: C.Identifier
    });
});

function verify(input: string, expectedType: C){
    const token = new LazyParserToken(0, 0, input, 0);
    const type = getExpressionTokenType(token);
    expect(format(input, type))
        .toBe(format(input, expectedType));
}

function format(input: string, type: C): any {
    return `${input} is ${C[type]}`;
}
