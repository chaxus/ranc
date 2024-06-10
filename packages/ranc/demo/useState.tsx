// import { render, useState } from "../index"
import { render, useState } from '../index'
// import { Fragment, h, render, useState } from '@/dist/index'

function App() {
  const [state, setState] = useState(false)
  const output = () => {
    console.log(state)
  }
  return (
    <>
      {/* <Child /> */}
      <button onClick={() => setState(!state)}>button1</button>
      {/* <button onClick={output}>console</button>
    <h1 onClick={() => setState(!state)}>
      <p>12454432</p>
    </h1> */}
      <Child />
      {state ? <h1>0</h1> : <a>none</a>}
    </>
  )
}

const Child = () => {
  const [state, setState] = useState(0)
  const change = () => {
    setState(state + 1)
  }
  return <button onClick={change}>child:{state}</button>
}

render(<App />, document.getElementById('app'))
