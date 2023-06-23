import { Fragment, h, render, useState } from "../index"

function App() {
  const [state, setState] = useState(true)
  return <>
    <button onClick={() => setState(!state)}>button</button>
    <h1 onClick={() => setState(!state)}>
      <p>12454432</p>
      fdsafds
    </h1>
    {/* {state ? <h1>0</h1> : <a>none</a>} */}
  </>
}

render(<App />, document.getElementById("app"))
