export function addElement(html) {
  var el = createElement(html)
  document.body.insertBefore(el, document.body.firstChild)
  return el
}

export function createElement(html) {
  var elDiv = document.createElement('div') //it creates a stupid parent div, fix it
  elDiv.innerHTML = html
  return elDiv.children[0]
}
