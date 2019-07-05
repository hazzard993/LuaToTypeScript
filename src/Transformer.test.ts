import * as luaparse from "luaparse";
import * as lua from "./ast";
import { Transformer } from "./Transformer";

const nodes = [
    "local x = 0",
];
const localStatementPermutations = [
    ["local x", "let x;"],
    ["local x = 0", "let x = 0;"],
    ["local x, y", "let x, y;"],
    ["local x, y = 1, 2", "let [x, y] = [1, 2];"],
    ["local x, y = xy()", "let [x, y] = xy();"],
];

describe("Check for transformer errors" , () => {
    const transformer = new Transformer();
    describe("Local Statements", () => {
        test.each([
            ["local a", "Identifier"],
            ["local a = 1", "Identifier -> NumericLiteral"],
            ["local a = 'string'", "Identifier -> StringLiteral"],
            ["local a, b = 1, 2", "Identifier x2 -> NumericLiteral x2"],
            ["local a, b = xy()", "Identifier x2 -> CallExpression"],
        ])("%p can be transformed. (%p)", luaCode => {
            const ast = luaparse.parse(luaCode, { ranges: true }) as lua.Chunk;
            expect(() => transformer.transformChunk(ast)).not.toThrowError();
        });
    });
    describe("Assignment Statements", () => {
        test.each([
            ["a = 1", "Identifier -> NumericLiteral"],
            ["a.b = 1", "MemberExpression -> NumericLiteral"],
            ["table[index] = 1", "IndexExpression -> NumericLiteral"],
            ["a, b = 1", "Identifier x2 -> NumericLiteral x2"],
            ["a.b, a.c = 1", "MemberExpression x2 -> NumericLiteral x2"],
            ["table[index], table[index] = 1, 2", "IndexExpression x2 -> NumericLiteral x2"],
            ["a, b = 1", "IndexExpression x2 -> NumericLiteral (unbalanced)"],
        ])("%p can be transformed. (%p)", luaCode => {
            const ast = luaparse.parse(luaCode, { ranges: true }) as lua.Chunk;
            expect(() => transformer.transformChunk(ast)).not.toThrowError();
        });
    });
});
