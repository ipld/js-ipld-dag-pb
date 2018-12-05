'use strict'

/**
 * Adds a link with its name as property to an object.
 *
 * The link won't be added if its name is empty or matches one of the existing
 * properties.
 *
 * @param object {Object} - The object that contains an array of links
 * @param name {string} - The name of the link to add
 * @param position {numner} - The position within the array of links
 */
const addNamedLink = (object, name, position) => {
  const skipNames = ['', ...Object.keys(this)]
  if (skipNames.includes(name)) {
    return
  }
  Object.defineProperty(object, name, {
    enumerable: true,
    configurable: true,
    get: () => object._links[position]
  })
}

module.exports = addNamedLink
