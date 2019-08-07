import { TranspileResult } from "./transpile";
import { createVirtualProgram, findAndParseConfigFileOptions } from "./utils";

export function generateDeclarations(result: TranspileResult): TranspileResult {
    const options = findAndParseConfigFileOptions({ declaration: true });
    const program = createVirtualProgram(result.transpiledFiles, options);

    const outputFiles: Record<string, string> = {};

    const writeFile = (fileName: string, content: string) => {
        outputFiles[fileName] = content;
    };

    program.emit(undefined, writeFile, undefined, true);

    return {
        transpiledFiles: Object.keys(outputFiles).map(outputFileName => {
            return {
                ast: new WeakMap(),
                diagnostics: [],
                fileName: outputFileName,
                tsCode: outputFiles[outputFileName],
            };
        }),
    };
}
