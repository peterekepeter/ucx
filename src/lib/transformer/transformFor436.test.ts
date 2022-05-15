import { UcParser, UnrealClass } from "../parser";
import { ucTokenizeLine } from "../tokenizer/ucTokenizeLine";
import { SourceEditor } from "./SourceEditor";
import { transformFor436 } from "./transformFor436";

test("replaces array count expression with resolved count", () => expect(transform(`
    var string RuleList[512];
    var string GameModeName[ArrayCount(RuleList)];
`)).toBe(`
    var string RuleList[512];
    var string GameModeName[512];
`));


test("replaces array count expression with resolved count", () => expect(transform(`
    var string RuleList[512];

    function Initialize() {
        local int i;
        for (i = 0; i < ArrayCount(RuleList); i++) {
            RuleList[i] = "";
        }
    }
`)).toBe(`
    var string RuleList[512];

    function Initialize() {
        local int i;
        for (i = 0; i < 512; i++) {
            RuleList[i] = "";
        }
    }
`));

function transform(input: string): string {
    const editor = new SourceEditor(input);
    const uc = parse(input);
    transformFor436(editor, uc);
    return editor.result;
}

function parse(input: string) : UnrealClass {
    const parser = new UcParser();
    const lines = input.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        for (const token of ucTokenizeLine(lines[i])) {
            parser.parse(i, token.position, token.text);
        }
    }
    parser.endOfFile(input.length, 0);
    return parser.result;
}