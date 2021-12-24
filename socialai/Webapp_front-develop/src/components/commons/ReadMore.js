import React from "react"
import ReactDOM from "react-dom"
import PropTypes from "prop-types"
import parse from "html-react-parser"
class ReadMore extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      showMore: false,
    }
  }

  render() {
    const { props } = this
    const {
      children,
      ellipsis,
      readMoreText,
      readLessText,
      readMoreClassName,
      readLessClassName,
      readMoreStyle,
      readLessStyle,
      charLimit,
      keyWords,
    } = props
    const { showMore } = this.state

    let shortText =
      children
        .substr(0, charLimit)
        .replace(/[\s\n]+$/, "")
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]+$/, "") +
      (charLimit >= children.length ? "" : ellipsis)
    let fullText = children
    const that = this
    let searchKeyword = ""
    let regexObj = ""
    
    let searchKeywords = keyWords.filter(res=>{
      return res.typeName.indexOf('Keyword') === 0;
    })
    for (var i = 0; i < searchKeywords.length; i++) {
      searchKeyword = " " + searchKeywords[i].value

      regexObj = new RegExp(searchKeyword, "gi")
      shortText = shortText.replace(
        regexObj,
        function(str) {return  " <span style='background-color:yellow;'>" + str + "</span>"}
       
      )
      fullText = fullText.replace(
        regexObj,
        function(str) {return  " <span style='background-color:yellow;'>" + str + "</span>"}
      )
      regexObj = ""
    }
    shortText = parse(shortText)
    fullText = parse(fullText)
    const ReadMore = () =>
      charLimit >= children.length || !readMoreText ? null : (
        <span
          className={readMoreClassName}
          role="presentation"
          style={readMoreStyle}
          onClick={() => {
            that.setState({ showMore: true })
          }}
        >
          {readMoreText}
        </span>
      )
    const ReadLess = () =>
      charLimit >= children.length || !readLessText ? null : (
        <span
          className={readLessClassName}
          role="presentation"
          style={readLessStyle}
          onClick={() => {
            that.setState({ showMore: false })
          }}
        >
          {readLessText}
        </span>
      )
    return (
      <React.Fragment>
        <span title={children} style={{ color: "#5e5e5e" }}>
          {showMore ? fullText : shortText}{" "}
          {showMore ? <ReadLess /> : <ReadMore />}
        </span>
      </React.Fragment>
    )
  }
}

ReadMore.propTypes = {
  charLimit: PropTypes.number,
  ellipsis: PropTypes.string,
  readMoreText: PropTypes.string,
  readLessText: PropTypes.string,
  readMoreClassName: PropTypes.string,
  readLessClassName: PropTypes.string,
  readMoreStyle: PropTypes.object,
  readLessStyle: PropTypes.object,
  children: PropTypes.string.isRequired,
}
ReadMore.defaultProps = {
  charLimit: 150,
  ellipsis: "…",
  readMoreText: "Read more",
  readLessText: "Read less",
  readMoreClassName: "react-read-more-read-less react-read-more-read-less-more",
  readLessClassName: "react-read-more-read-less react-read-more-read-less-less",
  readMoreStyle: { whiteSpace: "nowrap", cursor: "pointer" },
  readLessStyle: { whiteSpace: "nowrap", cursor: "pointer" },
}

export default ReadMore
