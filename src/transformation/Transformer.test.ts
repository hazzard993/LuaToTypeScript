import * as luaparse from "luaparse";
import * as diagnose from "../diagnose";
import { Transformer } from "./Transformer";

describe("Check for transformer errors", () => {
  const transformer = new Transformer(undefined, {});
  describe("Local Statements", () => {
    test.each([
      ["local a", "Identifier"],
      ["local a = 1", "Identifier -> NumericLiteral"],
      ["local a = 'string'", "Identifier -> StringLiteral"],
      ["local a, b = 1, 2", "Identifier x2 -> NumericLiteral x2"],
      ["local a, b = xy()", "Identifier x2 -> CallExpression"],
    ])("%p can be transformed. (%p)", (luaCode) => {
      const ast = luaparse.parse(luaCode, { ranges: true, locations: true });
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
      [
        "table[index], table[index] = 1, 2",
        "IndexExpression x2 -> NumericLiteral x2",
      ],
      ["a, b = 1", "IndexExpression x2 -> NumericLiteral (unbalanced)"],
    ])("%p can be transformed. (%p)", (luaCode) => {
      const ast = luaparse.parse(luaCode, { ranges: true, locations: true });
      expect(() => transformer.transformChunk(ast)).not.toThrowError();
    });
  });
  describe("Function Declarations", () => {
    test.each([
      ["function a() end", "FunctionDeclaration"],
      ["function a(b, c) end", "FunctionDeclaration + Parameters x2"],
      ["function a(...) end", "FunctionDeclaration + Vararg Parameter"],
      [
        "function a(b, c, ...) end",
        "FunctionDeclaration + Parameters x2 + Vararg Parameter",
      ],
    ])("%p can be transformed. (%p)", (luaCode) => {
      const ast = luaparse.parse(luaCode, { ranges: true, locations: true });
      expect(() => transformer.transformChunk(ast)).not.toThrowError();
    });
  });
  describe("Call Expressions", () => {
    test.each([
      ["a()", "CallStatement + No Args"],
      ["a(1, 2, 3)", "CallStatement + 3 Args"],
      ['a""', "StringCallExpression"],
      ["a{}", "TableCallExpression"],
    ])("%p can be transformed. (%p)", (luaCode) => {
      const ast = luaparse.parse(luaCode, { ranges: true, locations: true });
      expect(() => transformer.transformChunk(ast)).not.toThrowError();
    });
  });
});

describe("Detect diagnostic errors", () => {
  describe("LocalStatement type guards", () => {
    test.each([
      [
        "LocalStatement string to number is not assignable",
        "-- @type number\nlocal x = 'string'",
      ],
    ])("LocalStatement %p diagnostic", (_, luaCode) => {
      const diagnostics = diagnose.getSemanticDiagnosticsFromLuaCode(luaCode);
      expect(diagnostics.length).toBeGreaterThan(0);
      expect(diagnostics[0].messageText).toBe(
        `Type 'string' is not assignable to type 'number'.`,
      );
    });
  });
});
