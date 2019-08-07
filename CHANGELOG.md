## Version 0.2.0

- Declarations are now generated using typing information found in a _tsconfig.json_ file in the current directory.

```json
{
  "compilerOptions": {
    "types": ["lua-types/jit"]
  }
}
```

If _lua-types_ is installed as a package in the current directory, it will be used when trying to extract typing information from Lua files.

```lua
return setmetatable({}, {})
```

If _lua-types_ is in the current directory and _tsconfig.json_ is configured as above, TypeScript will recognize what _setmetatable_ does and appropriately type the information.

```ts
declare const _default: {};
export = _default;
```

If this did not happen, TypeScript doesn't understand what _setmetatable_ does and assumes it returns anything.

```ts
declare const _default: any;
export = _default;
```

## Version 0.1.1

- Added `--declaration`. This generates _.d.ts_ files instead of _.ts_ files.
  - Typings are extracted using _lua-types_

## Version 0.0.6

- `_G` transforms to `globalThis`
- Bugfix for `and` not being transformed properly (#3)

## Version 0.0.5

- While statements are transformed properly
- Break statements too
- Using `--module` will check out the `@module` LDoc tag
- Using `--classmod` will use the `@classmod` LDoc tag

The tag `@module` will perform the following transformation:

```lua
--- Description
-- @module
local module = {}

function module:test() end

return module
```

```ts
export function test() {}
```

## Version 0.0.4

Top level return statements transform into `export = ...`.

```lua
local x = 0
function func()
    return 5
end
return x
```

```ts
let x = 0;
function func() {
  return 5;
}
export = x;
```

And `@classmod` generates a TypeScript class.

All function declarations that are added to a table are considered functions.

```lua
-- @classmod
local MyClass = {}

function MyClass:method() end

return MyClass
```

This transforms into:

```ts
class MyClass {
  method(): number {}
}
export = myclass;
```

Other than that, bug-fixes regarding how tags are obtained.

## Version 0.0.3

First NPM release!

Can be installed with:

```sh
yarn global add lua-to-typescript
# or
npm install -g lua-to-typescript
```

Can then you can use the following command on Lua files to transform them to TypeScript code:

```sh
ltts main.lua module.lua
# Creates main.ts and module.ts
```

Type annotations are also considered when transpiling functions.

```lua
-- @tparam number x
-- @tparam number y
-- @treturn number
-- @treturn number
function xy(x, y)
    return x + 1, y + 2
end

-- @type number
local x = 0
```
