'use strict'

class HelloWorld extends React.Component {
  render () {
    return <p>Hello, { this.props.name }</p>
  }
}

ReactDOM.render(
  <HelloWorld name="qqq" />,
  document.getElementById('app')
)
