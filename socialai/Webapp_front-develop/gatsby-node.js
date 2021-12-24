exports.onCreateBabelConfig = ({ actions }) => {
  actions.setBabelPlugin({
    name: "babel-plugin-import",
    options: {
      libraryName: "antd",
      style: true,
    },
  })
}

exports.onCreateWebpackConfig = ({
  stage,
  rules,
  loaders,
  plugins,
  actions,
}) => {
  if (stage === "build-html" || stage === "develop-html") {
    actions.setWebpackConfig({
      module: {
        rules: [
          {
            test: /canvas/,
            use: loaders.null(),
          },
          {
            test: /canvg/,
            use: loaders.null(),
          },
          {
            test: /firebase/,
            use: loaders.null(),
          },
        ],
      },
    })
  }
  if (stage === "build-javascript" || stage === "develop-javascript") {
    actions.setWebpackConfig({
      module: {
        rules: [
          {
            test: /canvg/,
            use: loaders.null(),
          },
        ],
      },
    })
  }
}

exports.onCreatePage = async ({ page, actions }) => {
  const { createPage } = actions

  // page.matchPath is a special key that's used for matching pages
  // only on the client.
  if (page.path.match(/^\/personalized-ads/)) {
    page.matchPath = "/personalized-ads/*"

    // Update the page.
    createPage(page)
  } else if (page.path.match(/^\/life-events/)) {
    page.matchPath = "/life-events/*"

    // Update the page.
    createPage(page)
  } else if (page.path.match(/^\/acal/)) {
    page.matchPath = "/acal/*"
    // Update the page.
    createPage(page)
  } /*else if (page.path.match(/^\/engagements/)) {
    page.matchPath = "/engagements/*"
    // Update the page.
    createPage(page)
  }*/
}
