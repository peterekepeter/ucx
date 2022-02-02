import { SemanticClass as C } from "..";
import { getExpressionTokenType } from "./getExpressionTokenType";


test("numbers", () => {
    verify("42", C.LiteralNumber);
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
});

function verify(input: string, expectedType: C){
    const actualType = getExpressionTokenType({
        text: input,
        classification: C.None,
        line: 0,
        position: 0,
    });
    expect(format(input, actualType))
        .toBe(format(input, expectedType));
}

function format(input: string, type: C): any {
    return `${input} is ${C[type]}`;
}
