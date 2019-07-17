#!/usr/bin/env node
import * as program from "commander";
import { transpile } from "./cli";

program
    .version("0.0.1")
    .usage("[options] <luaFiles...>")
    .option("-s, --show-semantic-errors", "Show semantic issues with Lua code via transpilation");

program.parse(process.argv);

if (program.args) {
    const showSemanticErrors = program.showSemanticErrors === true;
    transpile(program.args, showSemanticErrors);
}
