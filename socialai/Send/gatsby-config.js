/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.org/docs/gatsby-config/
 */

module.exports =
  process.env.NODE_ENV === "development"
    ? {
        siteMetadata: {
          title: "SocialMiningAi",
        },
        plugins: [
          `gatsby-plugin-styled-components`,
          `gatsby-plugin-antd`,
          {
            resolve: `gatsby-plugin-less`,
            options: {
              javascriptEnabled: true,
              modifyVars: {
                "primary-color": "#00648D",
                "font-family": "Arial",
                "layout-body-background": "#66ff79",
                "table-row-hover-bg": "#E6F0FF",
                "primary-1": "#E6F0FF",
              },
            },
          },
          {
            resolve: "gatsby-plugin-react-svg",
            options: {
              rule: {
                include: /static/,
              },
            },
          },
        ],
      }
    : process.env.GATSBY_FS_ORG_ID
    ? {
        plugins: [
          `gatsby-plugin-styled-components`,
          `gatsby-plugin-antd`,
          {
            resolve: `gatsby-plugin-fullstory`,
            options: {
              fs_org: process.env.GATSBY_FS_ORG_ID,
            },
          },
          {
            resolve: `gatsby-plugin-google-analytics`,
            options: {
              // The property ID; the tracking code won't be generated without it
              trackingId: process.env.GATSBY_GOOGLE_ANALYTIC_ID,
              // Defines where to place the tracking script - `true` in the head and `false` in the body
              head: true,
            },
          },
          {
            resolve: `gatsby-plugin-less`,
            options: {
              javascriptEnabled: true,
              modifyVars: {
                "primary-color": "#00648D",
                "font-family": "Arial",
                "layout-body-background": "#66ff79",
                "table-row-hover-bg": "#E6F0FF",
                "primary-1": "#E6F0FF",
              },
            },
          },
          {
            resolve: `gatsby-plugin-s3`,
            options: {
              bucketName: process.env.APP_S3_BUCKET,
              protocol: "https",
              hostname: process.env.APP_HOSTNAME,
            },
          },
          {
            resolve: "gatsby-plugin-react-svg",
            options: {
              rule: {
                include: /static/,
              },
            },
          },
        ],
      }
    : {
        plugins: [
          `gatsby-plugin-styled-components`,
          `gatsby-plugin-antd`,
          {
            resolve: `gatsby-plugin-less`,
            options: {
              javascriptEnabled: true,
              modifyVars: {
                "primary-color": "#00648D",
                "font-family": "Arial",
                "layout-body-background": "#66ff79",
                "table-row-hover-bg": "#E6F0FF",
                "primary-1": "#E6F0FF",
              },
            },
          },
          {
            resolve: `gatsby-plugin-s3`,
            options: {
              bucketName: process.env.APP_S3_BUCKET,
              protocol: "https",
              hostname: process.env.APP_HOSTNAME,
            },
          },
          {
            resolve: "gatsby-plugin-react-svg",
            options: {
              rule: {
                include: /static/,
              },
            },
          },
        ],
      }
