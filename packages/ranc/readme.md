<h1 align="center">ranc</h1>
<p align="center">Tiny UI JSX compiler with Hook for user interfaces</p>
<p align="center">
<a href="https://npmjs.com/package/ranc"><img src="https://img.shields.io/npm/v/ranc.svg" alt="npm-v"></a>
<a href="https://npmjs.com/package/ranc"><img src="https://img.shields.io/npm/dt/ranc.svg" alt="npm-d"></a>
<a href="https://bundlephobia.com/result?p=ranc"><img src="http://img.badgesize.io/https://unpkg.com/ranc/dist/index.cjs?compression=brotli&label=brotli" alt="brotli"></a>
<a href="#alternative-installation-methods"><img src="https://img.shields.io/badge/module%20formats-cjs%2C%20esm-green.svg" alt="module formats: cjs, esm"></a>
</p>

### Usage

```shell
npm install ranc
```

```tsx
import { render, useState } from 'ranc'
// If the jsx-runtime is not config, it needs to be imported
// import { Fragment, jsx } from 'ranc'

function App() {
  const [state, setState] = useState(false)
  const output = () => {
    console.log(state)
  }
  return (
    <>
      <button onClick={() => setState(!state)}>button</button>
      <button onClick={output}>console</button>
      <h1 onClick={() => setState(!state)}>
        <p>12454432</p>
      </h1>
      <Child />
      {state ? <h2>0</h2> : <a>none</a>}
    </>
  )
}

const Child = () => {
  const [state, setState] = useState(0)
  const change = () => {
    setState(state + 1)
  }
  return <h3 onClick={change}>child:{state}</h3>
}

render(<App />, document.getElementById('app'))
```

### jsx-runtime

- tsconfig.json

```json
 "compilerOptions": {
    "jsx": "preserve",
    "jsxFactory": "jsx",
    "jsxFragmentFactory": "Fragment",
    "jsxImportSource":"ranc",
  }
```

- babel:

```js
// .babelrc / babel.config.json
{
  "presets": [
    [
      "@babel/preset-react",
      {
        "runtime": "automatic",
        "importSource": "ranc"
      }
    ]
  ]
}
```

- esbuild

```js
 esbuild: {
    jsxFactory: 'jsx',
    jsxFragment: 'Fragment',
    jsxInject: 'import { jsx, Fragment } from "ranc"',
  },
```

### Hooks API

// TODO

#### useState

```tsx
function App() {
  const [state, setState] = useState(false)
  return (
    <>
      <button onClick={() => setState(!state)}>button</button>
      {state ? <h2>0</h2> : <a>none</a>}
    </>
  )
}

render(<App />, document.getElementById('app'))
```
