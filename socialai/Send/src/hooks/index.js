import { useEffect, useState, useRef } from "react"
import { getHandlerArgs, isSupported, visibility } from "./utils"

const isSupportedLocal = isSupported && visibility

function usePageVisibility() {
  const [initiallyVisible] = getHandlerArgs()
  const [isVisible, setIsVisible] = useState(initiallyVisible)
  useEffect(() => {
    if (isSupportedLocal) {
      const handler = () => {
        const [currentlyVisisble] = getHandlerArgs()
        setIsVisible(currentlyVisisble)
      }
      document.addEventListener(visibility.event, handler)
      return () => {
        document.removeEventListener(visibility.event, handler)
      }
    }
  }, [])

  return isVisible
}
//Following Dan Abramov's declarative Interval
function useInterval(callback, delay) {
  const savedCallback = useRef()

  useEffect(() => {
    savedCallback.current = callback
  })

  useEffect(() => {
    function tick() {
      savedCallback.current()
    }

    let id = delay === Infinity ? null : setInterval(tick, delay)
    return () => id && clearInterval(id)
  }, [delay])
}

function usePageVisibilityWithBeatTracker(
  callback = console.log,
  delay_default = 1000000
) {
  const pageIsVisible = usePageVisibility()
  const [delay, setDelay] = useState(delay_default)
  const [startTime, setStartTime] = useState(new Date())
  useInterval(() => {
    const endTime = new Date()
    // duration in seconds
    const duration = (endTime - startTime) / 1000
    callback({
      verb: "viewed",
      duration,
    })
    setStartTime(new Date())
  }, delay)

  if (pageIsVisible) {
    // only set if page is visible and not already set
    if (delay !== delay_default) {
      setStartTime(new Date())
      setDelay(delay_default)
    }
  } else {
    if (delay !== Infinity) {
      //timer is running
      const endTime = new Date()
      // duration in seconds
      const duration = (endTime - startTime) / 1000
      setDelay(Infinity) // pause timer
      callback({
        verb: "viewed",
        duration,
      })
    }
  }
}

export { usePageVisibility, useInterval, usePageVisibilityWithBeatTracker }
export { useBasePath } from "./useBasePath"
