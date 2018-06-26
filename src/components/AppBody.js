import React from 'react'
import { Component } from 'react'
import { Route } from 'react-router-dom'
import Viewer from '../containers/Viewer'
import Variants from '../containers/Variants'

class AppBody extends Component {
  render() {
    return (<div className="row">
      <div className="col-sm-8">
        <h1>Frankenstein Variorum: Reader</h1>
        <Route exact path="/:part/:source" component={Viewer} />
      </div>
      <div className="col-sm-4" className="sideColumn">
        <div className="row">
          <p>This is the reader interface. You may view one chapter of one text.
            Highlighted text indicates words or passages that vary across texts.
            Click on a highlighted selection to view these variations below.
            Relevant annotations will also appear in the lower right window.</p>
          <div className="panel panel-default">
            <div className="panel-heading">Variations</div>
            <div className="panel-body">
              <Variants />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="panel panel-default">
            <div className="panel-heading">Annotations</div>
            <div className="panel-body">
              <p>There are no annotations in this group.</p>
            </div>
          </div>
        </div>
      </div>
    </div>)
  }
}

export default AppBody
