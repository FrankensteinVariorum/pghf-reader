import React from 'react'
import PropTypes from 'prop-types'
import { Component } from 'react'
import sax from 'sax'
import CETEI from '../../node_modules/CETEIcean/src/CETEI' // :'(

function uuid() {
  let value = ''
  let i
  let random
  for (i = 0; i < 32; i++) {
    random = Math.random() * 16 | 0

    if (i === 8 || i === 12 || i === 16 || i === 20) {
      value += '-'
    }
    value += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16)
  }
  return value
}

class pointerParser {
  constructor(start, end, onclick) {
    this.start = start
    this.end = end
    this.clonedLine
    this.onclick = onclick
    this.serializer = new window.XMLSerializer()
    this.textLength = 0
    this.overlaps = false
    this.elementStack = []
    this.parser = sax.parser(true)
    this.completed = false

    this.parser.ontext = (text) => {
      const curEl = this.elementStack.slice(-1)[0]
      const normalizedText = text.replace(/\s+/g, ' ')
      const newLength = this.textLength + normalizedText.length
      // Xpointer fun here:
      if (!this.completed) {
        if (newLength >= this.start && newLength < this.end) {
          //  1. If count > $start but < $end we have overlap or multiple elements.
          //     we'll need to replace this text node with a text node until $start + <span>rest of node</span>.
          //     Set a flag that this has happened as we'll need to find the end
          this.overlaps = true
          const localStart = this.start - this.textLength
          const beforeText = document.createTextNode(normalizedText.substr(0, localStart))

          curEl.appendChild(beforeText)

          const variantString = normalizedText.substr(localStart)
          if (variantString.length > 0) {
            const variantText = document.createTextNode(variantString)
            const spanEl = document.createElement('span')
            spanEl.setAttribute('id', `_${uuid()}`)
            spanEl.appendChild(variantText)
            spanEl.classList.add('variant_display_mult')
            spanEl.onclick = this.onclick
            curEl.appendChild(spanEl)
          }
        } else if (newLength >= this.start && newLength >= this.end && !this.overlaps) {
          //  2. count > $start and > $end AND NO FLAG, we have a simple span.
          //     Split text node into textNode* + <span>variant</span> + textNode*
          const localStart = start - this.textLength
          const localEnd = end - localStart
          const localEndStart = end - this.textLength
          const beforeText = document.createTextNode(normalizedText.substr(0, localStart))
          const afterText = document.createTextNode(normalizedText.substr(localEndStart))

          curEl.appendChild(beforeText)

          const variantString = normalizedText.substr(localStart, localEnd)
          if (variantString.length > 0) {
            const variantText = document.createTextNode(variantString)
            const spanEl = document.createElement('span')
            spanEl.setAttribute('id', `_${uuid()}`)
            spanEl.classList.add('variant_display_mult')
            spanEl.onclick = this.onclick
            spanEl.appendChild(variantText)
            curEl.appendChild(spanEl)
          }

          curEl.appendChild(afterText)
          this.completed = true
        } else if (newLength >= this.start && newLength >= this.end && this.overlaps) {
          //  3. If count > $start, > $end, AND FLAG,
          //     we'll need to replace this text node with <span>until $end</span> + a text node with rest of string.
          const localEnd = end - this.textLength
          const variantString = normalizedText.substr(0, localEnd)

          if (variantString.length > 0) {
            const variantText = document.createTextNode(variantString)
            const spanEl = document.createElement('span')
            spanEl.setAttribute('id', `_${uuid()}`)
            spanEl.classList.add('variant_display_mult')
            spanEl.onclick = this.onclick
            spanEl.appendChild(variantText)

            curEl.appendChild(spanEl)
          }

          const afterText = document.createTextNode(normalizedText.substr(localEnd))
          curEl.appendChild(afterText)
          this.completed = true
        } else {
          curEl.appendChild(document.createTextNode(normalizedText))
        }
      } else {
        curEl.appendChild(document.createTextNode(normalizedText))
      }
      this.textLength = newLength
    }
    this.parser.onopentag = (tag) => {
      // let element
      // if (tag.name === 'span') {
      //   // copy the element from dom so that we can keep onclick events
      //   const span = this.origLine.querySelector(`#${tag.attributes.id}`)
      //   if (span) {
      //     element = span
      //   } else {
      //     element = document.createElement(tag.name)
      //   }
      // } else {
      //   element = document.createElement(tag.name)
      //   for (const attr of Object.keys(tag.attributes)) {
      //     if (attr === 'class') {
      //       element.classList.add(tag.attributes[attr])
      //     } else {
      //       element.setAttribute(attr, tag.attributes[attr])
      //     }
      //   }
      // }
      const element = document.createElement(tag.name)
      for (const attr of Object.keys(tag.attributes)) {
        if (attr === 'class') {
          element.classList.add(tag.attributes[attr])
        } else {
          element.setAttribute(attr, tag.attributes[attr])
        }
      }
      this.elementStack.push(element)
    }
    this.parser.onclosetag = () => {
      const curEl = this.elementStack.pop()
      const parent = this.elementStack.slice(-1)[0]
      if (parent) {
        parent.appendChild(curEl)
      } else {
        this.clonedLine = curEl
      }
    }
  }

  parseLine(line) {
    this.origLine = line
    this.parser.write(this.serializer.serializeToString(line)).close()
    return this.clonedLine
  }
}

const parser = new window.DOMParser()

export default class DocumentRenderer extends Component {
  componentDidMount() {
    this.refs.teiData.innerHTML = 'Loading...'
    if (this.props.collation && this.props.tei) {
      // Render TEI with CETEIcean
      const cc = new CETEI()
      cc.makeHTML5(this.props.tei, (teiData) => {
        const colDoc = parser.parseFromString(this.props.collation, 'text/xml')
        // Make links for text variants
        window.col = colDoc
        // for (const app of Array.from(colDoc.querySelectorAll('app:not([type="invariant"])')).slice(126, 129)) {
        for (const app of colDoc.querySelectorAll('app:not([type="invariant"])')) {
          for (const rdg of app.querySelectorAll(`rdg[wit='#${this.props.source}']`)) {
            const ptrs = rdg.querySelectorAll('ptr')
            if (ptrs.length > 0) {
              for (const ptr of ptrs) {
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

                  // Use a SAX approach to locate pointers in this line and create span elements
                  const saxParser =  new pointerParser(start, end, () => {
                    this.props.getVariants(app, rdg.getAttribute('wit'))
                  })
                  const newLine = saxParser.parseLine(line)
                  line.parentNode.replaceChild(newLine, line)
                } else {
                  const variant = teiData.querySelector(`#${xpointer}`)
                  if (variant) {
                    variant.classList.add('variant_display_mult')
                    variant.onclick = () => {
                      this.props.getVariants(app, rdg.getAttribute('wit'))
                    }
                  } else {
                    console.log(xpointer)
                  }
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
  getVariants: PropTypes.func,
  source: PropTypes.string,
  tei: PropTypes.string,
  collation: PropTypes.string,
}
