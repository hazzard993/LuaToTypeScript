import * as luaparse from "luaparse";
import * as lua from "./ast";
import * as cli from "./cli";
import { Transformer } from "./Transformer";
import * as ts from "typescript";

describe("Check for transformer errors", () => {
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
    describe("Function Declarations", () => {
        test.each([
            ["function a() end", "FunctionDeclaration"],
            ["function a(b, c) end", "FunctionDeclaration + Parameters x2"],
            ["function a(...) end", "FunctionDeclaration + Vararg Parameter"],
            ["function a(b, c, ...) end", "FunctionDeclaration + Parameters x2 + Vararg Parameter"],
        ])("%p can be transformed. (%p)", luaCode => {
            const ast = luaparse.parse(luaCode, { ranges: true }) as lua.Chunk;
            expect(() => transformer.transformChunk(ast)).not.toThrowError();
        });
    });
    describe("And operation should be &&", () => {
        const ast = luaparse.parse(`local a = true and false`, { ranges: true }) as lua.Chunk;
        const result = ts.createBlock(transformer.transformChunk(ast));
        expect(printAst(result)).toBe(`\
{
    let a = true && false;
}`);
    });
});

function printAst(node: ts.Node): string {
    const printer = ts.createPrinter({
        newLine: ts.NewLineKind.LineFeed,
    });
    const resultFile = ts.createSourceFile(
        "result.ts",
        "",
        ts.ScriptTarget.Latest,
        /*setParentNodes*/ false,
        ts.ScriptKind.TS
    );
    const out = printer.printNode(ts.EmitHint.Unspecified, node, resultFile);
    return out;
}

describe("Detect diagnostic errors", () => {
    describe("LocalStatement type guards", () => {
        test.each([["LocalStatement string to number is not assignable", "-- @type number\nlocal x = 'string'"]])(
            "LocalStatement %p diagnostic",
            (_, luaCode) => {
                const diagnostics = cli.getSemanticDiagnosticsFromLuaCode(luaCode);
                expect(diagnostics.length).toBeGreaterThan(0);
                expect(diagnostics[0].messageText).toBe(`Type '"string"' is not assignable to type 'number'.`);
            }
        );
    });
});
