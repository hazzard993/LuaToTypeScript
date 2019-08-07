import * as fs from "fs";
import * as luaparse from "luaparse";
import * as path from "path";
import * as ts from "typescript";
import * as lua from "./ast";
import { Transformer } from "./Transformer";

export interface TranspiledFile {
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
            const { ast, statements, tsCode, diagnostics } = transformLuaToTypeScript(contents.toString(), options);
            if (options.showSemanticErrors) {
                const semanticErrors = getSemanticDiagnosticsTypeScriptCode(tsCode);
                diagnostics.push(...semanticErrors.map(error => error.messageText.toString()));
            }
            return {
                diagnostics,
                fileName,
                tsCode,
            };
        });
    return {
        transpiledFiles,
    };
}

export function transformLuaCodeToTypeScriptStatements(
    luaCode: string,
    transformer: Transformer,
    sourceFile: ts.SourceFile
): {
    ast: WeakMap<ts.Node, lua.Node | undefined>;
    statements: ts.Statement[];
} {
    const luaAst = luaparse.parse(luaCode, { ranges: true }) as lua.Chunk;
    const statements = transformer.transformChunk(luaAst);
    const ast = transformer.getBuilder().getMap();
    return {
        ast,
        statements,
    };
}

export function transformLuaToTypeScript(
    luaCode: string,
    options: Options = {},
    sourceFile = ts.createSourceFile("dummy.ts", "", ts.ScriptTarget.ESNext),
    transformer = new Transformer(undefined, options)
): {
    ast: WeakMap<ts.Node, lua.Node | undefined>;
    diagnostics: string[];
    statements: ts.Statement[];
    tsCode: string;
} {
    const { ast, statements } = transformLuaCodeToTypeScriptStatements(luaCode, transformer, sourceFile);
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
        statements,
        tsCode,
    };
}

const libCache: { [key: string]: ts.SourceFile } = {};

export function createProgram(sourceFileCode = "// empty"): { program: ts.Program; sourceFileToUpdate: ts.SourceFile } {
    const sourceFileName = "someFileName.ts";
    const resultFile = ts.createSourceFile(
        sourceFileName,
        sourceFileCode,
        ts.ScriptTarget.Latest,
        false,
        ts.ScriptKind.TS
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
