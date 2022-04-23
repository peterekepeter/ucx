import { SourceEditor } from "./SourceEditor";


test("insert character", () =>{
    const editor = create("var x = 4;");
    editor.insert(0,4,'_');
    expect(editor.result).toBe("var _x = 4;");
})

test("insert variable", () => {
    const editor = create("var x = 9;")
    editor.insert(0,4,'i,');
    expect(editor.result).toBe("var i,x = 9;")
})

test('remove variable', () => {
    const editor = create("var i,j,k,l;")
    editor.remove(0,7,4);
    expect(editor.result).toBe("var i,j;")
})

function create(text: string) {
    return new SourceEditor(text);
}