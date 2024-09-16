<div align="center">
  <h1>Lua To TypeScript</h1>
  <a href="https://www.npmjs.com/package/lua-to-typescript"><img alt="npm" src="https://img.shields.io/npm/v/lua-to-typescript.svg?style=for-the-badge" /></a>
</div>

Transpiles Lua to TypeScript declaration and/or TypeScript source code.

```sh
npm install -g lua-to-typescript
```

To transpile files...

```sh
ltts main.lua
# Generates main.ts

ltts a.lua b.lua c.lua ...
# Generates a.ts, b.ts, c.ts, ...

ltts -d library.lua
# Generates library.d.ts
```

## LDoc

This program uses [LDoc](https://stevedonovan.github.io/ldoc/) type annotations for type information that is used in generated TypeScript code.

```lua
--- @tparam number a
--- @treturn number
local function f(a)
  return a
end

return a
```

Loosely translates to the below code. Note the type annotations.

```ts
function f(a: number): number {
  return a;
}

export = f;
```
