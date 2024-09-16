import { program } from "commander";
import { generateDeclarations } from "./declaration";
import { getSemanticDiagnostics } from "./diagnose";
import { emit } from "./emit";
import { transpile } from "./transpile";

program
  .usage("[options] <luaFiles...>")
  .option(
    "-s, --show-semantic-errors",
    "Show semantic issues with Lua code via transpilation",
  )
  .option("-m, --module", "Use the @module tag to transform a module")
  .option("-c, --classmod", "Use the @classmod tag to transform a class")
  .option("-d, --declaration", "Generate declaration files only");

export function parseCommandLine(args: string[]): void {
  program.parse(args);
  const opts = program.opts<{
    showSemanticErrors: boolean;
    module: boolean;
    classmod: boolean;
    declaration: boolean;
  }>();

  if (program.args) {
    const showSemanticErrors = opts.showSemanticErrors === true;
    const module = opts.module === true;
    const classmod = opts.classmod === true;
    const transpileResult = transpile(program.args, {
      showSemanticErrors,
      module,
      classmod,
    });

    if (showSemanticErrors) {
      const diagnostics = getSemanticDiagnostics(transpileResult, {});
      diagnostics.forEach((diagnostic) => {
        console.log(diagnostic.messageText);
      });
    }

    if (opts.declaration) {
      const declarationFiles = generateDeclarations(transpileResult);
      emit(declarationFiles);
    } else {
      emit(transpileResult);
    }
  }
}
