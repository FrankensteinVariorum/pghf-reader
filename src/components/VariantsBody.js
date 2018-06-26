import React from 'react'
import PropTypes from 'prop-types'
import { Component } from 'react'

export default class VariantsBody extends Component {
  render() {
    return (<div className="app">{
      this.props.variants.map((v) => {
        return v.values.map((val) => {
          return (<div key={val.wit.split('#')[1]} className={`rdg ${val.wit.split('#')[1]}`}>
            {val.text}
          </div>)
        })
      })
    }
    </div>)
  }
}

VariantsBody.propTypes = {
  variants: PropTypes.array
}
