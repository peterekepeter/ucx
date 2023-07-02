import { SemanticClass as C } from "..";
import { getExpressionTokenType } from "./getExpressionTokenType";
import { LazyParserToken } from "./LazyParserToken";


describe("numbers", () => {
    verify("42", C.LiteralNumber);
    verify("-42", C.LiteralNumber);
    verify("0.14", C.LiteralNumber);
    verify("0xFFAA", C.LiteralNumber);
});

describe("string", () => {
    verify('"Test"', C.LiteralString);
});

describe("name", () => {
    verify("'Test'", C.LiteralName);
});

describe("default is none", () => {
    verify("", C.None);
});

describe("identifier", () => {
    verify("maxValue", C.Identifier);
    verify("_member", C.Identifier);
    verify("x001", C.Identifier);
});

describe("operators", () => {
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
    verify("dot", C.Operator);
    verify("Dot", C.Operator);
    verify("DOT", C.Operator);
    verify("cross", C.Operator);
    verify("Cross", C.Operator);
    verify("CROSS", C.Operator);
});

describe("new is keyword", () => {
    verify("new", C.Operator);
});

describe("language constants", () => {
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
    test(format(input, expectedType), () => {
        const token = new LazyParserToken(0, 0, input, 0);
        const type = getExpressionTokenType(token);
        expect(format(input, type))
            .toBe(format(input, expectedType));
    });
}

function format(input: string, type: C): any {
    return `${input?input:'<empty>'} is ${C[type]}`;
}
