import React from "react"
// import { Label } from "./basicComponents"
// import { capitalize } from "./helpers"
import styled, { css } from "styled-components"
import { Tooltip, Progress, Avatar } from "antd"
import {
    SVGIcon
  } from "./basicComponents"
import HotIcon from "../../static/icons/HotIcon.svg"
import WarmIcon from "../../static/icons/WarmIcon.svg"
import ColdIcon from "../../static/icons/ColdIcon.svg"


const SVGIconBadge = styled(SVGIcon)`
  padding: 3px; 
  font-size: 16px;
  /* padding: 6px; */
`

const HotProgressBadge = styled.div`
  position: relative;
  top: -75px;
  left: 17px;
  height: 25px;
  width: 25px;
  border-radius: 30px;
  background: #ffffff;
  border: 2px solid rgba(252, 90, 90, 0.1);
  box-shadow: 0 1px 4px 0 rgba(55, 70, 95, 0.12);
`

const ColdProgressBadge = styled.div`
  position: relative;
  top: -85px;
  left: 19px;
  height: 35px;
  width: 35px;
  border-radius: 30px;
  background: #ffffff;
  border: 2px solid rgba(0, 101, 147, 0.1);
  box-shadow: 0 1px 4px 0 rgba(55, 70, 95, 0.12);
`

const WarmProgressBadge = styled.div`
  position: relative;
  top: -20px;
  left: 19px;
  height: 35px;
  width: 35px;
  border-radius: 30px;
  background: #ffffff;
  border: 2px solid rgba(255, 190, 66, 0.1);
  box-shadow: 0 1px 4px 0 rgba(55, 70, 95, 0.12);
`

const PostAvatar = ({ post, evalTerms }) => {

    let { getEvalTerms } = evalTerms;
    let terms = getEvalTerms;
    // if (post.tags.length > 0)
    //     terms = getEvalTerms.filter(term => post.tags.includes(term.intent))
    // console.log(terms)

    let includeTerms = terms.filter(term => term.include == true).map(term => term.text);
    let excludeTerms = terms.filter(term => term.exclude == true).map(term => term.text);
    // console.log(includeTerms)
    // console.log(excludeTerms)
    let includeRegex = new RegExp(includeTerms.join("|"), 'i');
    let excludeRegex = new RegExp(excludeTerms.join("|"), 'i');

    let result = (includeRegex.test(post.body) || includeRegex.test(post.threadTitle)) && !excludeRegex.test(post.body) && !excludeRegex.test(post.threadTitle);
    let strengh = result ? "HOT" : "COLD"; // prepared for hot/cold avatars

    return (
        <>
        {result ? (
          <>
            <Tooltip
              placement="top"
              title={"Hot Prospect"}
            >
              <Progress
                strokeColor={{
                  "0%": "#FFBE42",
                  "50%": "#FC5A5A",
                  "99%": "#EB4949",
                }}
                type="circle"
                width={62}
                percent={
                  strengh === "HOT"
                    ? 100
                    : strengh === "COLD"
                    ? 0
                    : 50
                }
                format={() => (
                  <Avatar
                    size={48}
                    src={`${
                      post.avatar ? post.avatar : "/images/avatar1.png"
                    }`}
                  />
                )}
              />
              {strengh === "HOT" && (
                <HotProgressBadge>
                  <SVGIconBadge component={HotIcon} />
                </HotProgressBadge>
              )}
            </Tooltip>
          </>
        ) : (
          <Avatar
            size={48}
            src={`${
              post.avatar ? post.avatar : "/images/avatar1.png"
            }`}
          />
        )}
      </>
    )
}

export default PostAvatar;
