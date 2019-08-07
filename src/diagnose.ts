import * as ts from "typescript";
import { transformLuaToTypeScript, TranspileResult } from "./transpile";
import { createVirtualProgram } from "./utils";

export function getSemanticDiagnostics(result: TranspileResult, options: ts.CompilerOptions): readonly ts.Diagnostic[] {
    const program = createVirtualProgram(result.transpiledFiles, options);
    return program.getSemanticDiagnostics();
}

export function getSemanticDiagnosticsFromLuaCode(luaCode: string): readonly ts.Diagnostic[] {
    const transpiledFile = transformLuaToTypeScript(luaCode);
    const program = createVirtualProgram([transpiledFile], {});
    return program.getSemanticDiagnostics();
}
