import * as luaparse from "luaparse";
import * as ts from "typescript";
import { Transformer } from "./transformation/Transformer";

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
    .map((fileName) => {
      return {
        contents: ts.sys.readFile(fileName, "utf8") || "",
        fileName,
      };
    })
    .map(({ contents, fileName }) => {
      const { tsCode, diagnostics } = transformLuaToTypeScript(
        contents.toString(),
        options,
      );

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

export function transformLuaToTypeScript(
  luaCode: string,
  options: Options = {},
  fileName = "dummy.ts",
  transformer = new Transformer(undefined, options),
): TranspiledFile {
  const sourceFile = ts.createSourceFile(
    "dummy.ts",
    "",
    ts.ScriptTarget.ESNext,
  );
  const luaAst = luaparse.parse(luaCode, { ranges: true, locations: true });
  const statements = transformer.transformChunk(luaAst);

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
  });

  const tsCode = statements
    .map((statement) => {
      return printer.printNode(ts.EmitHint.Unspecified, statement, sourceFile);
    })
    .join("\n");

  return {
    diagnostics: transformer.getDiagnostics(),
    fileName,
    tsCode,
  };
}
