
# 参考文档：

`react` 核心主要分成三个部分，`fiber` 节点，任务调度，`hook` 机制

- Fiber: https://juejin.cn/post/7063321486135656479
- Context: https://juejin.cn/post/7200002468460806205
- Hook ( useState,useEffect ): https://juejin.cn/post/7203336895887114300

首先，我们用 vdom 来描述界面结构，比如这样：

```js
{
  "type": "ul",
  "props": {
      "className": "list",
      "children": [
          {
              "type": "li",
              "props": {
                  "className": "item",
                  "children": [
                    "aa"
                  ]
              }
          },
          {
            "type": "li",
            "props": {
                "className": "item",
                "children": [
                  "bb"
                ]
            }
          }
        ]
   }
}
```

这很明显就是一个 ul、li 的结构。但是我们不会直接手写 vdom，而是会用 jsx：

```js
const data = {
    item1: 'bb',
    item2: 'cc'
}

const jsx =  <ul className="list">
    <li className="item" style={{ background: 'blue', color: 'pink' }} onClick={() => alert(2)}>aa</li>
    <li className="item">{data.item1}<i>xxx</i></li>
    <li className="item">{data.item2}</li>
</ul>;
```

jsx 使用 babel 编译，我们配置一下 .babelrc：

```js
module.exports = {
    presets: [
        [
            '@babel/preset-react',
            {
                pragma: 'Dong.createElement'
            }
        ]
    ]
}
```

然后用 babel 编译它：

```js
babel index.js -d ./dist
```

编译结果是这样的：

```js
const data = {
  item1: 'bb',
  item2: 'cc'
};
const jsx = Dong.createElement("ul", {
  className: "list"
}, Dong.createElement("li", {
  className: "item",
  style: {
    background: 'blue',
    color: 'pink'
  },
  onClick: () => alert(2)
}, "aa"), Dong.createElement("li", {
  className: "item"
}, data.item1, Dong.createElement("i", null, "xxx")), Dong.createElement("li", {
  className: "item"
}, data.item2));

```
这里的 createElement 就叫做 render function，它的执行结果是 vdom。
为什么不直接把 jsx 编译为 vdom 呢？
因为 render function 可以执行动态逻辑呀。我们可以加入 state、props，也可以包装一下实现组件。

这样，我们只要实现 Dong.createElement 就能拿到 vdom 了：

createElement 就是返回 type、props、children 的对象。

我们把 children 也放在 props 里，并且文本节点单独创建：

```js
function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map(child =>
                typeof child === "object"
                ? child
                : createTextElement(child)
            ),
        }
    }
}

function createTextElement(text) {
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: text,
            children: [],
        },
    }
}

const Dong = {
    createElement
}
```

这样执行以后渲染出来的就是 vdom：

我打印了一下：

接下来递归渲染这棵 vdom 不就是渲染么，也就是通过 document.createElement 创建元素、设置属性、样式、事件监听器等。

等等，如果这样做，那就是 React 16 之前的架构了。

React 16 之后引入了 fiber 架构，就是在这里做了改变，它不是直接渲染 vdom 了，而是先转成 fiber：

本来 vdom 里通过 children 关联父子节点，而 fiber 里面则是通过 child 关联第一个子节点，然后通过 sibling 串联起下一个，所有的节点可以 return 到父节点。
这样不就把一颗 vdom 树，变成了 fiber 链表么？

然后渲染 fiber 就可以了，和渲染 vdom 的时候一样。

为什么费这么多事转成另一种结构再渲染呢？这不是多此一举么？

那肯定不是，fiber 架构的意义在这：

之前我们是递归渲染 vdom 的，然后 diff 下来做 patch 的渲染：

这个渲染和 diff 是递归进行的。

现在变成了这样：

先把 vdom 转 fiber，也就是 reconcile 的过程，因为 fiber 是链表，就可以打断，用 schedule 来空闲时调度（requestIdleCallback）就行，最后全部转完之后，再一次性 render，这个过程叫做 commit。

这样，之前只有 vdom 的 render 和 patch，现在却变成了 vdom 转 fiber 的 reconcile，空闲调度 reconcile 的 scdule，最后把 fiber 渲染的 commit 三个阶段。

意义就在于这个可打断上。因为递归渲染 vdom 可能耗时很多，JS 计算量大了会阻塞渲染，而 fiber 是可打断的，就不会阻塞渲染，而且还会在这个过程中把需要用到的 dom 创建好，做好 diff 来确定是增是删还是改。

dom 有了，增删改也知道了咋做了，一次性 commit 不就很快了么。

这就是 fiber 架构的意义！


# fiber

# hook

# 任务调度
