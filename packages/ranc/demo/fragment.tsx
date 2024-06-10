import { render } from '../index'
// import { Fragment, h, render, useState } from '@/dist/index'

function App() {
    return (
        <>
            <div>Fragment</div>
            <>
                <div>h2</div>
            </>
            <>
                <>
                    <div>h3</div>
                </>
            </>
        </>
    )
}

render(<App />, document.getElementById('fragment'))
