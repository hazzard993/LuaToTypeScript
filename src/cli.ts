import * as program from "commander";
import { emit } from "./emit";
import { transpile } from "./transpile";

program
    .version("0.0.1")
    .usage("[options] <luaFiles...>")
    .option("-s, --show-semantic-errors", "Show semantic issues with Lua code via transpilation")
    .option("-m, --module", "Use the @module tag to transform a module")
    .option("-c, --classmod", "Use the @classmod tag to transform a class");

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
        emit(transpileResult);
    }
}
