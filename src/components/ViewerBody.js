import React from 'react'
import PropTypes from 'prop-types'
import { Component } from 'react'
import DocumentRenderer from './DocumentRenderer'

export default class ViewerBody extends Component {
  componentDidMount() {
    if (!this.props.collation) {
      // Only get the collation once
      // this.props.getCollation(`/data/collations/${this.props.song}.xml`)
      this.props.getCollation(`https://raw.githubusercontent.com/PghFrankenstein/Pittsburgh_Frankenstein/Text_Processing/collateXPrep/standoff/sga_collation_${this.props.part}.xml`)
      this.getResources()
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.source !== this.props.source) {
      this.getResources()
    }
  }

  getResources() {
    if (this.props.source === 'fMS') {
      this.props.getResource(`https://raw.githubusercontent.com/PghFrankenstein/Pittsburgh_Frankenstein/Text_Processing/collateXPrep/sga_chunks/${this.props.part}.xml`, 'tei')
    }
  }

  render() {
    return [
      (<h2 className="source" key="h2">{this.props.source}</h2>),
      (<DocumentRenderer key="dr"
        source={this.props.source}
        tei={this.props.tei}
        collation={this.props.collation} />)
    ]
  }
}

ViewerBody.propTypes = {
  getCollation: PropTypes.func,
  getResource: PropTypes.func,
  tei: PropTypes.string,
  collation: PropTypes.string,
  part: PropTypes.string,
  source: PropTypes.string
}
