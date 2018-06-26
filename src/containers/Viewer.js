import { connect } from 'react-redux'
import { getResource, getCollation, getVariants } from '../actions'
import { withRouter } from 'react-router'
import ViewerBody from '../components/ViewerBody'

const mapStateToProps = (state, ownProps) => {
  const returnProps = {}
  if (ownProps.match.params.source) {
    returnProps.source = ownProps.match.params.source
  }
  if (ownProps.match.params.part) {
    returnProps.part = ownProps.match.params.part
  }
  if (state.resources.tei) {
    if (!state.resources.tei.isFetching) {
      returnProps.tei = state.resources.tei.data
    } else {
      returnProps.tei = null
    }
  }
  if (state.resources.collation) {
    if (!state.resources.collation.isFetching) {
      returnProps.collation = state.resources.collation.data
    }
    if (state.resources.collation.sources) {
      returnProps.sources = state.resources.collation.sources
    }
  }
  return returnProps
}

const mapDispatchToProps = (dispatch) => {
  return {
    getResource: (url, type) => {
      dispatch(getResource(url, type))
    },
    getCollation: (url) => {
      dispatch(getCollation(url))
    },
    getVariants: (app, source) => {
      dispatch(getVariants(app, source))
    }
  }
}

const App = withRouter(connect(
  mapStateToProps,
  mapDispatchToProps
)(ViewerBody))

export default App
