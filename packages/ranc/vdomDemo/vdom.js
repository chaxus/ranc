const data = {
  item1: 'bb',
  item2: 'cc'
};
const jsx = createElement("ul", {
  className: "list"
}, createElement("li", {
  className: "item",
  style: {
    background: 'blue',
    color: 'pink'
  },
  onClick: () => alert(2)
}, "aa"), createElement("li", {
  className: "item"
}, data.item1, createElement("i", null, "xxx")), createElement("li", {
  className: "item"
}, data.item2));

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const App = () => {
  const [state, setState] = useState(true);
  return createElement("div", {
    className: "app"
  }, createElement(Child, {
    key: "1"
  }), createElement(Children, {
    key: "2"
  }), createElement("button", {
    onClick: () => setState(!state)
  }, "change"), state ? createElement("h1", null, "0") : createElement("a", null, "none"));
};
const Children = () => {
  return createElement("div", {
    className: "children"
  }, "children");
};
const Child = () => {
  return createElement("div", {
    className: "child"
  }, "child");
};
export default App;