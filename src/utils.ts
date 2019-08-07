import * as ts from "typescript";
import * as path from "path";
import { TranspiledFile } from "./transpile";

export function createVirtualProgram(typeScriptFiles: TranspiledFile[], options: ts.CompilerOptions): ts.Program {
    const sourceFiles: Record<string, string> = {};
    typeScriptFiles.forEach(sourceFile => {
        sourceFiles[sourceFile.fileName.replace(".lua", ".ts")] = sourceFile.tsCode;
    });

    const compilerHost = ts.createCompilerHost(options);
    const formerGetSourceFile = compilerHost.getSourceFile;
    compilerHost.getSourceFile = (fileName, ...args) => {
        if (fileName in sourceFiles) {
            return ts.createSourceFile(fileName, sourceFiles[fileName], ts.ScriptTarget.Latest, false);
        } else {
            return formerGetSourceFile(fileName, ...args);
        }
    };

    return ts.createProgram(Object.keys(sourceFiles), options, compilerHost);
}

export function findAndParseConfigFileOptions(options: ts.CompilerOptions): ts.CompilerOptions {
    const configFilePath = ts.findConfigFile(".", ts.sys.fileExists);
    if (configFilePath) {
        const { options: mergedOptions } = ts.parseJsonSourceFileConfigFileContent(
            ts.readJsonConfigFile(configFilePath, ts.sys.readFile),
            ts.sys,
            path.dirname(configFilePath),
            options,
            configFilePath
        );

        return mergedOptions;
    } else {
        throw new Error("Could not find tsconfig.json");
    }
}
