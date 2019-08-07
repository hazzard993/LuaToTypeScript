# Lua To TypeScript

<a href="https://www.npmjs.com/package/lua-to-typescript"><img alt="npm" src="https://img.shields.io/npm/v/lua-to-typescript.svg?style=for-the-badge" /></a>

Converts Lua to TypeScript code. Uses [LDoc](https://stevedonovan.github.io/ldoc/) type annotations for typing information.

```sh
yarn global add lua-to-typescript
# or
npm install -g lua-to-typescript
```

Then use `ltts` to use the CLI.

```sh
ltts --help

ltts main.lua
# Generates main.ts

ltts a.lua b.lua c.lua ...
# Generates a.ts, b.ts, c.ts, ...

ltts -d library.lua
# Generates library.d.ts
```

Supports the following tags:

- `@type`
- `@tparam`
- `@treturn`

Can translate classes marked with `@classmod` to a TypeScript class using the `-c` option.

Can translate modules marked with `@module` to a TypeScript module using the `-m` option.

Can generate declaration files from existing Lua code. Typing information is obtained from [lua-types](https://github.com/ark120202/lua-types).

## Example Input and Output

**abc.lua**

```lua
-- @tparam number a
-- @tparam string b
-- @tparam number c
local function abc(a, b, c)
    print(a, b, c)
end

return abc
```

Using `ltts -d abc.lua`, this translates to:

**abc.d.ts**

```ts
declare function abc(a: number, b: string, c: number): void;
export = abc;
```

See the new features added in the [CHANGELOG](CHANGELOG.md).
