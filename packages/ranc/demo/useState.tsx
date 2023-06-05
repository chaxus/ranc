import { Fragment, h, render, useState } from "../index"

function App() {
    debugger
    const [state, setState] = useState(true)
    return <>
      <button onClick={() => setState(!state)}>change</button>
      {state ? <h1>0</h1> : <a>none</a>}
    </>
}

render(<App />, document.getElementById("app"))
