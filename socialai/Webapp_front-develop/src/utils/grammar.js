const AN = "an"
const A = "a"

export const prependArticleToWord = string => {
  if (!string || typeof string !== "string") return null
  return `${getArticleFromWord(string)} ${string.toLowerCase()}`
}
export const getArticleFromWord = string => {
  if (String(string[0]).match(/[aeiou]/i)) return AN
  return A
}
