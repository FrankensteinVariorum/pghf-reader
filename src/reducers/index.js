import { REQUEST_RESOURCE, RECEIVE_RESOURCE, GET_COLLATION_SOURCES } from '../actions'
import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'

const parser = new window.DOMParser()

function reduceResource(state = {}, action) {
  let newState = {}
  switch (action.type) {
    case REQUEST_RESOURCE:
      newState = {}
      newState[action.docType] = { isFetching: true }
      return Object.assign({}, state, newState)
    case RECEIVE_RESOURCE:
      newState = {}
      newState[action.docType] = {
        isFetching: false,
        data: action.data,
        lastUpdated: action.receivedAt
      }
      return Object.assign({}, state, newState)
    default:
      return state
  }
}

function getCollationSources(state = {}) {
  const colDoc = parser.parseFromString(state.data, 'text/xml')
  const rdgs = colDoc.querySelector('app').querySelectorAll('rdg')
  const sources = Array.from(rdgs).reduce((srcs, rdg) => {
    const ptr = rdg.querySelector('ptr')
    if (ptr) {
      srcs.push(rdg.querySelector('ptr').getAttribute('target').split('#')[0])
    }
    return srcs
  }, [])
  return Object.assign({}, state, {sources})
}

function resources(state = {}, action) {
  switch (action.type) {
    case RECEIVE_RESOURCE:
    case REQUEST_RESOURCE:
      return Object.assign({}, state,
        reduceResource(state.resources, action)
      )
    case GET_COLLATION_SOURCES:
      return Object.assign({}, state,
        {collation: getCollationSources(state.collation)}
      )
    default:
      return state
  }
}

const pghfReader = combineReducers({
  resources,
  router: routerReducer
})

export default pghfReader
