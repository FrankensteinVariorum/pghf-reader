import React from 'react'
import PropTypes from 'prop-types'
import { Component } from 'react'
import { Link } from 'react-router-dom'
import DocumentRenderer from './DocumentRenderer'

export default class ViewerBody extends Component {
  componentDidMount() {
    if (!this.props.collation) {
      // Only get the collation once
      // this.props.getCollation(`/data/collations/${this.props.song}.xml`)
      this.props.getCollation(`https://raw.githubusercontent.com/PghFrankenstein/Pittsburgh_Frankenstein/Text_Processing/collateXPrep/standoff_Spine/spine_${this.props.part}.xml`)
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
    } else if (this.props.source === 'f1818') {
      this.props.getResource(`https://raw.githubusercontent.com/PghFrankenstein/Pittsburgh_Frankenstein/Text_Processing/collateXPrep/bridge-P5/P5-f1818_${this.props.part}.xml`, 'tei')
    } else if (this.props.source === 'f1823') {
      this.props.getResource(`https://raw.githubusercontent.com/PghFrankenstein/Pittsburgh_Frankenstein/Text_Processing/collateXPrep/bridge-P5/P5-f1823_${this.props.part}.xml`, 'tei')
    } else if (this.props.source === 'f1831') {
      this.props.getResource(`https://raw.githubusercontent.com/PghFrankenstein/Pittsburgh_Frankenstein/Text_Processing/collateXPrep/bridge-P5/P5-f1831_${this.props.part}.xml`, 'tei')
    } else if (this.props.source === 'fThomas') {
      this.props.getResource(`https://raw.githubusercontent.com/PghFrankenstein/Pittsburgh_Frankenstein/Text_Processing/collateXPrep/bridge-P5/P5-fThomas_${this.props.part}.xml`, 'tei')
    }
  }

  render() {
    if (this.props.tei) {
      return [
        (<ul key="list" className="tempMenu">
          <li><Link to={'/C10/fMS'}>MS</Link></li>
          <li><Link to={'/C10/f1818'}>1818</Link></li>
          <li><Link to={'/C10/f1823'}>1823</Link></li>
          <li><Link to={'/C10/f1831'}>1831</Link></li>
          <li><Link to={'/C10/fThomas'}>Thomas</Link></li>
        </ul>),
        (<h2 className="source" key="h2">{this.props.source}</h2>),
        (<DocumentRenderer key="dr"
          source={this.props.source}
          tei={this.props.tei}
          getVariants={this.props.getVariants}
          collation={this.props.collation} />)
      ]
    } else {
      return ''
    }
  }
}

ViewerBody.propTypes = {
  getCollation: PropTypes.func,
  getVariants: PropTypes.func,
  getResource: PropTypes.func,
  tei: PropTypes.string,
  collation: PropTypes.string,
  part: PropTypes.string,
  source: PropTypes.string
}
