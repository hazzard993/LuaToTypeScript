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
// test.each([
//     [],
// ])("")