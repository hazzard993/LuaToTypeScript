import { transformLuaToTypeScript } from "./transpile";

describe.only("Check transpiler output", () => {
  describe("Local Statements", () => {
    test.each([
      ["local a", "let a;", "Identifier"],
      ["local a = 1", "let a = 1;", "Identifier -> NumericLiteral"],
      [
        "local a = 'string'",
        'let a = "string";',
        "Identifier -> StringLiteral",
      ],
      [
        "local a, b = 1, 2",
        "let [a, b] = [1, 2];",
        "Identifier x2 -> NumericLiteral x2",
      ],
      [
        "local a, b = xy()",
        "let [a, b] = xy();",
        "Identifier x2 -> CallExpression",
      ],
    ])("%p transforms into %p. (%p)", (luaCode, expectedTsCode) => {
      const { tsCode: receivedTsCode } = transformLuaToTypeScript(luaCode);
      expect(receivedTsCode).toStrictEqual(expectedTsCode);
    });
  });
  describe("Assignment Statements", () => {
    test.each([
      ["a = 1", "a = 1;", "Identifier -> NumericLiteral"],
      ["a.b = 1", "a.b = 1;", "MemberExpression -> NumericLiteral"],
      [
        "table[index] = 1",
        "table[index] = 1;",
        "IndexExpression -> NumericLiteral",
      ],
      ["a, b = xy()", "[a, b] = xy();", "Identifier x2 -> CallExpression"],
      [
        "a.b, a.c = xy()",
        "[a.b, a.c] = xy();",
        "MemberExpression x2 -> CallExpression",
      ],
      [
        "table[index], table[index] = 1, 2",
        "[table[index], table[index]] = [1, 2];",
        "IndexExpression x2 -> NumericLiteral x2",
      ],
      ["a, b = xy()", "[a, b] = xy();", "Identifier x2 -> CallExpression"],
    ])("%p transforms into %p. (%p)", (luaCode, expectedTsCode) => {
      const { tsCode: receivedTsCode } = transformLuaToTypeScript(luaCode);
      expect(receivedTsCode).toStrictEqual(expectedTsCode);
    });
  });
  describe("Table Constructors", () => {
    test.each([
      ["a = { b, c }", "a = [b, c];", "TableValue x2"],
      ["a = { b = 1, c = 2 }", "a = { b: 1, c: 2 };", "TableKeyString x2"],
      ["a = { [b] = 1, [c] = 2 }", "a = { [b]: 1, [c]: 2 };", "TableKey x2"],
    ])("%p transforms into %p. (%p)", (luaCode, expectedTsCode) => {
      const { tsCode: receivedTsCode } = transformLuaToTypeScript(luaCode);
      expect(receivedTsCode).toStrictEqual(expectedTsCode);
    });
  });
});
