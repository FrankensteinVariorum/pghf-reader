import React from 'react'
import PropTypes from 'prop-types'
import { Component } from 'react'
import CETEI from '../../node_modules/CETEIcean/src/CETEI' // :'(

const parser = new window.DOMParser()

export default class DocumentRenderer extends Component {
  shouldComponentUpdate(nextProps) {
    if (this.props.tei || nextProps.tei) {
      return true
    } else {
      return false
    }
  }

  componentDidUpdate() {
    function textNodesUnder(el) {
      let n
      const a = []
      const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false)
      while (n = walk.nextNode()) a.push(n)
      return a
    }

    this.refs.teiData.innerHTML = 'Loading...'
    if (this.props.collation && this.props.tei) {
      // Render TEI with CETEIcean
      const cc = new CETEI()
      cc.makeHTML5(this.props.tei, (teiData) => {
        const colDoc = parser.parseFromString(this.props.collation, 'text/xml')
        // Make links for text variants
        window.col = colDoc
        for (const app of colDoc.querySelectorAll('app:not([type="invariant"])')) {
          for (const rdg of app.querySelectorAll(`rdg[wit='#${this.props.source}']`)) {
            const ptrs = rdg.querySelectorAll('ptr')
            if (ptrs.length > 0) {
              for (const ptr of ptrs) {
                // Here's some fun XPointer processing. yay!
                const [source, xpointer] = ptr.getAttribute('target').split('#')
                if (xpointer.includes('string-range(')) {
                  // Parse data from target URL
                  const surfaceId = source.match(/\/([^\/]+?)\.xml$/)[1]
                  const [zoneAndLine, startVal, endVal] = xpointer.match(/^string-range\((.*)\)$/)[1].split(',')
                  const start = Math.max(parseInt(startVal, 10) - 1, 0)
                  const end = parseInt(endVal, 10) - 1
                  const zoneType = zoneAndLine.match(/@type='([^']+)'/)[1]
                  const lineNum = parseInt(zoneAndLine.match(/line\[([^\]]+)\]/)[1], 10)
                  const surface = teiData.querySelector(`tei-surface[*|id='${surfaceId}']`)
                  const zone = surface.querySelector(`tei-zone[type='${zoneType}']`)
                  const line = zone.querySelectorAll('tei-line')[lineNum - 1]

                  let textLength = 0
                  let overlaps = false
                  for (const node of textNodesUnder(line)) {
                    // Normalize space and add its length to character count
                    const normalizedText = node.textContent.replace(/\s+/g, ' ')
                    const newLength = textLength + normalizedText.length
                    if (newLength >= start && newLength < end) {
                      // FIX::!! sustr works differently than you thought: (START POSITION, CHARS FROM START)

                      //  1. If count > $start but < $end we have overlap or multiple elements.
                      //     we'll need to replace this text node with a text node until $start + <span>rest of node</span>.
                      //     Set a flag that this has happened as we'll need to find the end
                      overlaps = true
                      const localStart = start - textLength
                      const beforeText = document.createTextNode(normalizedText.substr(0, localStart))
                      const variantText = document.createTextNode(normalizedText.substr(localStart))
                      const lineEl = node.parentNode
                      const spanEl = document.createElement('span')
                      spanEl.appendChild(variantText)
                      spanEl.classList.add('variant_display_single')
                      lineEl.insertBefore(spanEl, node.nextSibling)
                      lineEl.replaceChild(beforeText, node)
                    } else if (newLength >= start && newLength >= end && !overlaps) {
                      //  2. count > $start and > $end AND NO FLAG, we have a simple span.
                      //     Split text node into textNode* + <span>variant</span> + textNode*
                      const localStart = start - textLength
                      const localEnd = end - localStart
                      const localEndStart = end - textLength
                      const beforeText = document.createTextNode(normalizedText.substr(0, localStart))
                      const variantText = document.createTextNode(normalizedText.substr(localStart, localEnd))
                      const afterText = document.createTextNode(normalizedText.substr(localEndStart))
                      // console.log(start, localStart, end, localEnd, normalizedText, variantText, afterText)
                      const lineEl = node.parentNode
                      const spanEl = document.createElement('span')
                      spanEl.classList.add('variant_display_single')
                      lineEl.replaceChild(beforeText, node)
                      spanEl.appendChild(variantText)
                      lineEl.appendChild(spanEl)
                      lineEl.appendChild(afterText)
                    } else if (newLength > start && newLength >= end && overlaps) {
                      //  3. If count > $start, > $end, AND FLAG,
                      //     we'll need to replace this text node with <span>until $end</span> + a text node with rest of string.
                      const localEnd = end - textLength
                      const variantText = document.createTextNode(normalizedText.substr(0, localEnd))
                      const afterText = document.createTextNode(normalizedText.substr(localEnd))
                      const lineEl = node.parentNode
                      const spanEl = document.createElement('span')
                      spanEl.classList.add('variant_display_single')
                      spanEl.appendChild(variantText)
                      lineEl.replaceChild(spanEl, node)
                      lineEl.appendChild(afterText)
                      overlaps = false
                    }
                    textLength = newLength
                  }
                } else {
                  const variant = teiData.querySelector(`#${xpointer}`)
                  variant.classList.add('variant_display_single')
                  // variant.onclick = () => {
                  //   this.props.getVariants(app, rdg.getAttribute('wit'))
                  //   this.props.setPopoutPosition(variant.getBoundingClientRect())
                  // }
                }
              }
            }
          }
        }
        this.refs.teiData.innerHTML = ''
        this.refs.teiData.appendChild(teiData)
      })
    }
  }

  render() {
    return (<div ref="teiData" key={this.props.source}>Loading...</div>)
  }
}

DocumentRenderer.propTypes = {
  source: PropTypes.string,
  tei: PropTypes.string,
  collation: PropTypes.string,
}
