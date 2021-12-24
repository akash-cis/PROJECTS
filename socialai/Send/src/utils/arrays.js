export const arraysAreEqual = (a, b) => {
  if (!a || !b) return false
  if (!Array.isArray(a) || !Array.isArray(b)) return false
  if (a.length !== b.length) return false

  const idsA = a.map(item => Number(item.id))
  const idsB = b.map(item => Number(item.id))

  for (let i = 0; i <= idsA.length; i++) {
    if (idsA[i] !== idsB[i]) {
      return false
    }
  }
  return true
}
