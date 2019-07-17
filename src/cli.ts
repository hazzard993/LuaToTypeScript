import * as fs from "fs";
import * as luaparse from "luaparse";
import * as path from "path";
import * as ts from "typescript";
import * as lua from "./ast";
import { Transformer } from "./Transformer";

export function transpile(files: string[], showSemanticErrors: boolean) {
    const contents = files.filter(ts.sys.fileExists).map(filename => ts.sys.readFile(filename, "utf8"));
    if (contents.length > 0) {
        contents.forEach(content => {
            if (content) {
                const {
                    ast,
                    statements,
                    tsCode,
                    diagnostics,
                } = transformLuaToTypeScript(content.toString());
                diagnostics.map(diagnostic => console.log("⚠ ", diagnostic, "\n"));
                function foreach(node: ts.Node) {
                    console.log(ast.get(node));
                    ts.forEachChild(node, foreach);
                }
                statements.forEach(statement => ts.forEachChild(statement, foreach));
                if (showSemanticErrors) {
                    const semanticErrors = getSemanticDiagnosticsTypeScriptCode(tsCode);
                    semanticErrors.map(error => console.log(error.messageText));
                }
            }
        });
    }
}

export function transformLuaCodeToTypeScriptStatements(
    luaCode: string,
    transformer: Transformer,
    sourceFile: ts.SourceFile,
): {
    ast: WeakMap<ts.Node, lua.Node | undefined>,
    statements: ts.Statement[],
 } {
    const luaAst = luaparse.parse(luaCode, {ranges: true}) as lua.Chunk;
    const statements = transformer.transformChunk(luaAst);
    const ast = transformer.getBuilder().getMap();
    return {
        ast,
        statements,
    };
}

export function transformLuaToTypeScript(
    luaCode: string,
    transformer = new Transformer(),
    sourceFile = ts.createSourceFile("dummy.ts", "", ts.ScriptTarget.ESNext),
): {
    ast: WeakMap<ts.Node, lua.Node | undefined>,
    diagnostics: string[],
    statements: ts.Statement[],
    tsCode: string,
} {
    const {
        ast,
        statements,
    } = transformLuaCodeToTypeScriptStatements(luaCode, transformer, sourceFile);
    const printer = ts.createPrinter({
        newLine: ts.NewLineKind.LineFeed,
    });
    const tsCode = statements.map(statement => {
        return printer.printNode(
            ts.EmitHint.Unspecified,
            statement,
            sourceFile,
        );
    }).join("\n");
    return {
        ast,
        diagnostics: transformer.getDiagnostics(),
        statements,
        tsCode,
    };
}

const libCache: { [key: string]: ts.SourceFile } = {};

export function createProgram(sourceFileCode = "// empty"): { program: ts.Program, sourceFileToUpdate: ts.SourceFile } {
    const sourceFileName = "someFileName.ts";
    const resultFile = ts.createSourceFile(
        sourceFileName,
        sourceFileCode,
        ts.ScriptTarget.Latest,
        false,
        ts.ScriptKind.TS,
    );
    return {
        program: ts.createProgram({
            host: {
                directoryExists: () => true,
                fileExists: () => true,
                getCanonicalFileName: fileName => fileName,
                getCurrentDirectory: () => ".",
                getDefaultLibFileName: ts.getDefaultLibFileName,
                getNewLine: () => "\n",
                getSourceFile: fileName => {
                    if (fileName === sourceFileName) {
                        return resultFile;
                    } else if (fileName.startsWith("lib.")) {
                        if (libCache[fileName]) {
                            return libCache[fileName];
                        }
                        const typeScriptDir = path.dirname(require.resolve("typescript"));
                        const filePath = path.join(typeScriptDir, fileName);
                        const content = fs.readFileSync(filePath, "utf8");

                        libCache[fileName] = ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, false);

                        return libCache[fileName];
                    }
                },
                readFile: () => resultFile.getFullText(),
                useCaseSensitiveFileNames: () => true,
                writeFile: () => {},
            },
            options: {},
            rootNames: [sourceFileName],
        }),
        sourceFileToUpdate: resultFile,
    };
}

export function getSemanticDiagnosticsFromLuaCode(luaCode: string): readonly ts.Diagnostic[] {
    const { tsCode } = transformLuaToTypeScript(luaCode);
    const { program, sourceFileToUpdate } = createProgram(tsCode);
    return program.getSemanticDiagnostics(sourceFileToUpdate);
}

export function getSemanticDiagnosticsTypeScriptCode(tsCode: string): readonly ts.Diagnostic[] {
    const { program, sourceFileToUpdate } = createProgram(tsCode);
    return program.getSemanticDiagnostics(sourceFileToUpdate);
}
