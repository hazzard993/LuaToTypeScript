import * as ts from "typescript";
import { TranspileResult } from "./transpile";

export function emit(transpileResult: TranspileResult): void {
    transpileResult.transpiledFiles.forEach(transpiledFile => {
        const outputFileName = transpiledFile.fileName.replace(".lua", ".ts");
        ts.sys.writeFile(outputFileName, transpiledFile.tsCode);
    });
}
