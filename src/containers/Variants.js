import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import VariantsBody from '../components/VariantsBody'

const mapStateToProps = (state) => {
  return {variants: state.variants}
}

const mapDispatchToProps = () => { return { } }

const Variants = withRouter(connect(
  mapStateToProps,
  mapDispatchToProps
)(VariantsBody))

export default Variants
