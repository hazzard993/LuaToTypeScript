# Lua To TypeScript

Converts Lua to TypeScript code. Uses [LDoc](https://stevedonovan.github.io/ldoc/) type annotations for typing information.

Also planned to generate declarations from existing Lua code.

```sh
yarn global add lua-to-typescript
# or
npm install -g lua-to-typescript
```

Then use _ltts_ to create _.ts_ files from Lua.

```sh
ltts main.lua
ltts a.lua b.lua c.lua ...
```

## Features

Code documented with [LDoc](https://stevedonovan.github.io/ldoc/) is used for typing information.

```lua
-- @tparam number x
-- @tparam number y
function func(x, y) end
```

```ts
function func(x: number, y: number) {}
```

This can also be applied to variables as well.

```lua
-- @type number
local x = "string"
```

```ts
let x: number = "string";   // TypeScript now sees this as a semantic error
```