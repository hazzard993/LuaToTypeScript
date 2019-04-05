import * as luaparse from "luaparse";
import * as ts from "typescript";
import * as lua from "./ast";
import { Transformer } from "./Transformer";

const ast = luaparse.parse("local i = 0", {ranges: true}) as lua.Chunk;
const transformer = new Transformer();
console.log(transformer.transformChunk(ast));
