export function addElement(html) {
  var elDiv = document.createElement('div') //it creates a stupid parent div, fix it
  elDiv.innerHTML = html
  var elChild = elDiv.children[0]
  document.body.insertBefore(elChild, document.body.firstChild)
  return elChild
}
