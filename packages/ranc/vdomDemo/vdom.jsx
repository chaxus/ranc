const data = {
  item1: 'bb',
  item2: 'cc',
}

const jsx = (
  <ul className="list">
    <li
      className="item"
      style={{ background: 'blue', color: 'pink' }}
      onClick={() => alert(2)}
    >
      aa
    </li>
    <li className="item">
      {data.item1}
      <i>xxx</i>
    </li>
    <li className="item">{data.item2}</li>
  </ul>
)

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const App = () => {
  const [state, setState] = useState(true)
  return (
    <div className="app">
      <Child key="1" />
      <Children key="2"></Children>
      <button onClick={() => setState(!state)}>change</button>
      {state ? <h1>0</h1> : <a>none</a>}
      <p>p:{state}</p>
    </div>
  )
}

const Children = () => {
  return <div className="children">children</div>
}

const Child = () => {
  return <div className="child">child</div>
}

export default App
