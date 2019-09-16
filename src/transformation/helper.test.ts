import * as luaparse from "luaparse";
import * as helper from "./helper";

describe("Test getCommentsAsString", () => {
    test.each<[string, number, string]>([
        ["i = 0", 0, ""],
        ["--comment,i = 0", 0, "comment"],
        ["--two,--comments,i = 0", 0, "two comments"],
        ["i = 0,--second statement comment,i = 0", 1, "second statement comment"],
        ["--first statement comment,i = 0,--ignored comment,i = 0", 0, "first statement comment"],
        ["--ignored comment,i = 0,--second statement comment,i = 0", 1, "second statement comment"],
        ["--[[square bracket comment]]i = 0", 0, "square bracket comment"],
    ])("Get comments from %s", (code: string, nodeIndex: number, fullCommentText: string) => {
        code = code.replace(/,/g, "\n");
        const ast = luaparse.parse(code, { ranges: true, locations: true });
        const commentText = helper.getCommentsAsString(ast, ast.body[nodeIndex]);
        expect(commentText).toEqual(fullCommentText);
    });
});

describe("Test getCommentsAsString", () => {
    test.each<[string, number, string]>([
        ["i = 0", 0, ""],
        ["--comment,i = 0", 0, "comment"],
        ["--two,--comments,i = 0", 0, "two comments"],
        ["i = 0,--second statement comment,i = 0", 1, "second statement comment"],
        ["--ignored comment,i = 0,--second statement comment,i = 0", 1, "second statement comment"],
        ["--[[square bracket comment]]i = 0", 0, "square bracket comment"],
    ])("Get comments from %s", (code: string, nodeIndex: number, fullCommentText: string) => {
        code = code.replace(/,/g, "\n");
        const ast = luaparse.parse(code, { ranges: true, locations: true });
        const commentText = helper.getCommentsAsString(ast, ast.body[nodeIndex]);
        expect(commentText).toEqual(fullCommentText);
    });
});
