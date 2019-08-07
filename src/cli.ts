import * as program from "commander";
import { emit } from "./emit";
import { transpile } from "./transpile";
import { generateDeclarations } from "./declaration";

program
    .usage("[options] <luaFiles...>")
    .option("-s, --show-semantic-errors", "Show semantic issues with Lua code via transpilation")
    .option("-m, --module", "Use the @module tag to transform a module")
    .option("-c, --classmod", "Use the @classmod tag to transform a class")
    .option("-d, --declaration", "Generate declaration files only");

export function parseCommandLine(args: string[]): void {
    program.parse(process.argv);

    if (program.args) {
        const showSemanticErrors = program.showSemanticErrors === true;
        const module = program.module === true;
        const classmod = program.classmod === true;
        const transpileResult = transpile(program.args, {
            showSemanticErrors,
            module,
            classmod,
        });

        if (showSemanticErrors) {
            transpileResult.transpiledFiles.forEach(transpiledFile => {
                transpiledFile.diagnostics.forEach(diagnostic => console.log(diagnostic));
            });
        }

        if (program.declaration) {
            const declarationFiles = generateDeclarations(transpileResult);
            emit(declarationFiles);
        } else {
            emit(transpileResult);
        }
    }
}
