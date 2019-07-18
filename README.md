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

See the new features added in the [CHANGELOG](CHANGELOG.md).