import fetch from 'isomorphic-fetch'

export const REQUEST_RESOURCE = 'REQUEST_RESOURCE'
export const RECEIVE_RESOURCE = 'RECEIVE_RESOURCE'
export const GET_COLLATION_SOURCES = 'GET_COLLATION_SOURCES'
export const SET_VARIANTS = 'SET_VARIANTS'

const parser = new window.DOMParser()
const serializer = new window.XMLSerializer()

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

function requestResource(url, docType) {
  return {
    type: REQUEST_RESOURCE,
    url,
    docType
  }
}

function receiveResource(data, docType) {
  return {
    type: RECEIVE_RESOURCE,
    data,
    receivedAt: Date.now(),
    docType
  }
}

function getCollationSources() {
  return {
    type: GET_COLLATION_SOURCES,
  }
}

export function setVariants(variants) {
  return {
    type: SET_VARIANTS,
    variants
  }
}

/** ********
 * thunks *
 ******** **/

export function getResource(url, docType) {
  return dispatch => {
    dispatch(requestResource(url, docType))
    return fetch(url)
      .then(response => response.text())
      .then(data => {
        // Resolve xincludes if present
        const doc = parser.parseFromString(data, 'text/xml')
        const xincludes = []
        for (const xinclude of doc.querySelectorAll('include')) {
          xincludes.push(new Promise((res) => {
            fetch(xinclude.getAttribute('href'))
              .then(response => response.text())
              .then(xiData => {
                const xiDataDoc = parser.parseFromString(xiData, 'text/xml')
                xinclude.parentNode.replaceChild(xiDataDoc.documentElement, xinclude)
                res()
              })
          }))
        }
        Promise.all(xincludes).then(() => dispatch(receiveResource(serializer.serializeToString(doc), docType)))
      })
  }
}

export function getCollation(url) {
  return dispatch => {
    dispatch(getResource(url, 'collation'))
      .then(() => dispatch(getCollationSources()))
  }
}

function textNodesUnder(el) {
  let n
  const a = []
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false)
  while (n = walk.nextNode()) a.push(n)
  return a
}

export function getVariants(app, lemma) {
  return dispatch => {
    const variants = []
    const promises = []
    for (const reading of Array.from(app.querySelectorAll('rdg'))) {
      const wit = reading.getAttribute('wit')
      const isLemma = wit === lemma ? true : false
      const [sourceUrl, xpointer] = reading.children[0].getAttribute('target').split('#')
      promises.push(
        fetch(sourceUrl)
          .then(response => response.text())
          .then(text => {
            const source = parser.parseFromString(text, 'text/xml')
            if (wit !== '#fMS') {
              const variant = source.querySelector(`[*|id="${xpointer}"]`)
              variants.push({
                group: uuid(),
                values: [
                  {
                    text: variant.textContent,
                    sourceUrl: sourceUrl,
                    wit,
                    isLemma
                  }
                ]
              })
            } else {
              const surfaceId = sourceUrl.match(/\/([^\/]+?)\.xml$/)[1]
              const [zoneAndLine, startVal, endVal] = xpointer.match(/^string-range\((.*)\)$/)[1].split(',')
              const start = Math.max(parseInt(startVal, 10) - 1, 0)
              const end = parseInt(endVal, 10) - 1
              const zoneType = zoneAndLine.match(/@type='([^']+)'/)[1]
              const lineNum = parseInt(zoneAndLine.match(/line\[([^\]]+)\]/)[1], 10)
              const surface = source.querySelector(`surface[*|id='${surfaceId}']`)
              const zone = surface.querySelector(`zone[type='${zoneType}']`)
              const line = zone.querySelectorAll('line')[lineNum - 1]

              let textLength = 0
              let overlaps = false
              let variantText = ''
              for (const textNode of textNodesUnder(line)) {
                const normalizedText = textNode.nodeValue.replace(/\s+/g, ' ')
                const newLength = textLength + normalizedText.length
                if (newLength >= start && newLength < end) {
                  overlaps = true
                  const localStart = start - textLength
                  variantText += ` ${normalizedText.substr(localStart)} `
                } else if (newLength >= start && newLength >= end && !overlaps) {
                  const localStart = start - textLength
                  const localEnd = end - localStart
                  variantText += ` ${normalizedText.substr(localStart, localEnd)} `
                } else if (newLength >= start && newLength >= end && overlaps) {
                  const localEnd = end - textLength
                  variantText += ` ${normalizedText.substr(0, localEnd)} `
                }
                textLength = newLength
              }
              variants.push({
                group: uuid(),
                values: [
                  {
                    text: variantText,
                    sourceUrl: sourceUrl,
                    wit,
                    isLemma
                  }
                ]
              })
            }
          })
      )
    }
    Promise.all(promises).then(() => {
      dispatch(setVariants(variants))
    })
  }
}
