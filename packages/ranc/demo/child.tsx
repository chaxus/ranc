// import { render, useState } from "../index"
import { render, useState } from '../index'
// import { Fragment, h, render, useState } from '@/dist/index'

function App() {
    return (
        <>
            <div>app</div>
            <Child />
        </>
    )
}
function Sub() {
    return (
        <>
            <div>sub</div>
        </>
    )
}

function Children() {
    return (
        <>
            <div>children</div>
            <Sub />
        </>
    )
}

const Child = () => {
    return <>
        <div>child</div>
        <Children></Children>
    </>
}

render(<App />, document.getElementById('child'))
