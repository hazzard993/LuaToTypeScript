import * as luaparse from "luaparse";
import * as ts from "typescript";
import * as lua from "./ast";
import { Transformer } from "./Transformer";

export function transpile(args: string[]) {
    const files = args;
    const contents = files.filter(ts.sys.fileExists).map(filename => ts.sys.readFile(filename, "utf8"));
    if (contents.length > 0) {
        const program = ts.createProgram({
            options: {},
            rootNames: [],
        });
        const transformer = new Transformer(program);
        contents.forEach(content => {
            const ast = luaparse.parse(content as string, {ranges: true}) as lua.Chunk;
            const statements = transformer.transformChunk(ast);
            const block = ts.createBlock(statements);
            const sourceFile = ts.createSourceFile("", "", ts.ScriptTarget.ES5);
            const resultFile = ts.createSourceFile(
                "someFileName.ts",
                "",
                ts.ScriptTarget.Latest,
                false,
                ts.ScriptKind.TS,
            );
            const printer = ts.createPrinter({
                newLine: ts.NewLineKind.LineFeed,
            });
            const result = printer.printNode(
                ts.EmitHint.Unspecified,
                block,
                resultFile,
            );
            console.log(result);
        });
    }
}
