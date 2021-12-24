export const toKebabCase = string => {
  if (!string) return null
  return (
    string.slice(0, 1).toUpperCase() +
    string.slice(1, string.length)?.replace(/[A-Z]/g, " $&")
  )
}

export const toSnake = str => {
  if (!str) return null
  let snake = str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
  if (snake[0] === "_") {
    return snake.slice(1, snake.length)
  }
  return snake
}

export const toCamel = s => {
  if (!s) return null
  return s
    .replace(/([-_][a-z])/gi, v => {
      return v
        .toUpperCase()
        .replace("-", "")
        .replace("_", "")
    })
    .replace(/^[A-Z]/, v => v.toLowerCase())
}

export const snakeCaseToTitleCase = s => {
  if (!s) return null
  return String(s)
    .toLowerCase()
    .replace(/([-_][a-z])/gi, v => {
      return v.replace("-", " ").replace("_", " ")
    })
}

export const capitalize = string => {
  if (!string) return null
  return (
    String(string)
      .charAt(0)
      .toUpperCase() + string.slice(1)
  )
}
