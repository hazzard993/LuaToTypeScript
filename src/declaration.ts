import * as ts from "typescript";
import * as path from "path";
import * as fs from "fs";
import { TranspileResult } from "./transpile";

const libCache: { [key: string]: ts.SourceFile } = {};

/** @internal */
export function createVirtualProgram(result: TranspileResult, options: ts.CompilerOptions): ts.Program {
    const sourceFiles: Record<string, string> = {};
    result.transpiledFiles.forEach(sourceFile => {
        sourceFiles[sourceFile.fileName.replace("\.lua", ".ts")] = sourceFile.tsCode;
    });

    const compilerHost: ts.CompilerHost = {
        fileExists: () => true,
        getCanonicalFileName: fileName => fileName,
        getCurrentDirectory: () => "",
        getDefaultLibFileName: ts.getDefaultLibFileName,
        readFile: () => "",
        getNewLine: () => "\n",
        useCaseSensitiveFileNames: () => false,
        writeFile: () => {},

        getSourceFile: filename => {
            if (filename in sourceFiles) {
                return ts.createSourceFile(filename, sourceFiles[filename], ts.ScriptTarget.Latest, false);
            }

            if (filename.startsWith("lib.")) {
                if (libCache[filename]) return libCache[filename];
                const typeScriptDir = path.dirname(require.resolve("typescript"));
                const filePath = path.join(typeScriptDir, filename);
                const content = fs.readFileSync(filePath, "utf8");

                libCache[filename] = ts.createSourceFile(filename, content, ts.ScriptTarget.Latest, false);

                return libCache[filename];
            }

            const matches = filename.match("lua-types");
            if (matches) {
                if (filename.includes("@types")) {
                    const mutatedFileName = filename
                        .replace("jit/index.d.ts", "jit.d.ts")
                        .replace("jit/core.ts", "core/index.d.ts")
                        .replace("jit/", "core/")
                        .replace("core/special/", "special/")
                        .replace(/\.d\.ts/, "")
                        .replace(/\.ts/, "")
                        .replace("node_modules/@types/lua-types", "") + ".d.ts";
                    const luaTypesRoot = path.resolve(path.join(__dirname, "..", "node_modules", "lua-types"));
                    const fullPath = path.join(luaTypesRoot, mutatedFileName);
                    const content = fs.readFileSync(fullPath, "utf8");

                    return ts.createSourceFile(filename, content, ts.ScriptTarget.Latest, false);
                }
            }
        },
    };

    return ts.createProgram(Object.keys(sourceFiles), options, compilerHost);
}

export function generateDeclarations(result: TranspileResult): TranspileResult {
    const program = createVirtualProgram(result, {
        types: [
            "lua-types/jit",
        ],
        declaration: true
    });

    const outputFiles: Record<string, string> = {};

    const writeFile = (fileName: string, data: string, writeByteOrderMark: boolean, onError?: (message: string) => void, sourceFiles?: ReadonlyArray<ts.SourceFile>) => {
        outputFiles[fileName] = data;
    };

    program.emit(undefined, writeFile, undefined, true);
    return {
        transpiledFiles: Object.keys(outputFiles).map(outputFileName => {
            return {
                diagnostics: [],
                fileName: outputFileName,
                tsCode: outputFiles[outputFileName]
            };
        })
    };
}
