test('First test', () => {
  expect(sum(5, 2)).toBe(7)
})


function sum(a, b) {
  return a + b
}

//TODO use babel in test, in order to be able to use import/export