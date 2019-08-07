import * as luaparse from "luaparse";
import * as ts from "typescript";
import { Transformer } from "./transformation/Transformer";

export interface TranspiledFile {
    ast: WeakMap<ts.Node, luaparse.Node | undefined>;
    diagnostics: string[];
    fileName: string;
    tsCode: string;
}

export interface TranspileResult {
    transpiledFiles: TranspiledFile[];
}

export interface Options {
    showSemanticErrors?: boolean;
    module?: boolean;
    classmod?: boolean;
}

export function transpile(files: string[], options: Options): TranspileResult {
    const transpiledFiles = files
        .filter(ts.sys.fileExists)
        .map(fileName => {
            return {
                contents: ts.sys.readFile(fileName, "utf8") || "",
                fileName,
            };
        })
        .map(({ contents, fileName }) => {
            const { ast, tsCode, diagnostics } = transformLuaToTypeScript(contents.toString(), options);

            return {
                ast,
                diagnostics,
                fileName,
                tsCode,
            };
        });

    return {
        transpiledFiles,
    };
}

export function transformLuaToTypeScript(
    luaCode: string,
    options: Options = {},
    fileName = "dummy.ts",
    transformer = new Transformer(undefined, options)
): TranspiledFile {
    const sourceFile = ts.createSourceFile("dummy.ts", "", ts.ScriptTarget.ESNext);
    const luaAst = luaparse.parse(luaCode, { ranges: true }) as luaparse.Chunk;
    const statements = transformer.transformChunk(luaAst);
    const ast = transformer.getBuilder().getMap();

    const printer = ts.createPrinter({
        newLine: ts.NewLineKind.LineFeed,
    });

    const tsCode = statements
        .map(statement => {
            return printer.printNode(ts.EmitHint.Unspecified, statement, sourceFile);
        })
        .join("\n");

    return {
        ast,
        diagnostics: transformer.getDiagnostics(),
        fileName,
        tsCode,
    };
}
