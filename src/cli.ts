import * as program from "commander";
import { emit } from "./emit";
import { transpile } from "./transpile";

program
    .version("0.0.1")
    .usage("[options] <luaFiles...>")
    .option("-s, --show-semantic-errors", "Show semantic issues with Lua code via transpilation");

export function parseCommandLine(args: string[]): void {
    program.parse(process.argv);

    if (program.args) {
        const showSemanticErrors = program.showSemanticErrors === true;
        const transpileResult = transpile(program.args, showSemanticErrors);
        emit(transpileResult);
    }
}
