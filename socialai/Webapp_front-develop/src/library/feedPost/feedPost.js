import React from "react"
import { Avatar, List, Progress, Typography } from "antd"
import PropTypes from "prop-types"
import ColdIcon from "../../../static/icons/ColdIcon.svg"
import HotIcon from "../../../static/icons/HotIcon.svg"
import LocationIcon from "../../../static/icons/LocationIcon.svg"
import RemoveActive from "../../../static/icons/RemoveActive.svg"
import RemoveIcon from "../../../static/icons/RemoveIcon.svg"
import StarIcon from "../../../static/icons/StarIcon.svg"
import StarIconActive from "../../../static/icons/StarIconActive.svg"
import WarmIcon from "../../../static/icons/WarmIcon.svg"
import { TagColored, TooltipButton } from "../../library/basicComponents"
import { ProspectStatus, TagColors } from "../../library/constants"
import {
  BottomInfo,
  ButtonInfo,
  ColdProgressBadge,
  HotProgressBadge,
  Info,
  InfoIcon,
  InfoText,
  ProspectItem,
  savedActive,
  SourceIcon,
  SourceText,
  SVGIconBadge,
  ThreadTitle,
  WarmProgressBadge,
} from "./elements"
import { parseTimestamp } from "./helpers"
import { capitalize } from "../helpers"
import { ResponseButton } from "./responseButton"
import { Link } from "gatsby"
const { Paragraph } = Typography

const DescriptionParagraph = ({ item, id2, isMobile }) => {
  //Removes any unwanted phrases that have been added to this list
  const excludePhrases = [
    "QR Code Link to This Post",
    "(adsbygoogle = window.adsbygoogle || []).push({});",
  ]
  let paragraph = item.body
  excludePhrases.forEach(excludePhrase => {
    if (paragraph.includes(excludePhrase)) {
      paragraph = paragraph.replace(excludePhrase, "")
    }
  })
  //Removes HTML tags from post
  paragraph = paragraph.replace(/(<([^>]+)>)/gi, "")
  return (
    <div key={id2}>
      <Paragraph
        style={{ marginBottom: "0" }}
        ellipsis={{
          rows: isMobile ? 3 : 2,
          expandable: true,
          // onExpand: () => typoExpand(item.id),
        }}
      >
        {paragraph}
        {/* {expand[item.id] && (
          <a style={{ marginLeft: "10px" }} onClick={() => typoClose(item.id)}>
            Close
          </a>
        )} */}
      </Paragraph>
    </div>
  )
}

export const FeedPost = ({ item, updateStatus, hideSource, authorRenderer }) => {
  return (
    <ProspectItem key={item.id} id={item.id} style={{ paddingTop: "1.5em" }}>
      <List.Item.Meta
        avatar={
          <>
            {item.strength ? (
              <>
                <Progress
                  strokeColor={{
                    "0%": "#FFBE42",
                    "50%": "#FC5A5A",
                    "99%": "#EB4949",
                  }}
                  type="circle"
                  width={72}
                  percent={
                    item.strength === "HOT"
                      ? 100
                      : item.strength === "COLD"
                      ? 0
                      : 50
                  }
                  format={() => (
                    <Avatar
                      size={32}
                      src={
                        item.avatar
                          ? item.avatar
                          : `/images/sources/${item?.sourceType?.toLowerCase()}.png` ||
                            "/images/sources/forum.png"
                      }
                    />
                  )}
                />
                {item.strength === "COLD" && (
                  <ColdProgressBadge>
                    <SVGIconBadge component={ColdIcon} />
                  </ColdProgressBadge>
                )}
                {item.strength === "WARM" && (
                  <WarmProgressBadge>
                    <SVGIconBadge component={WarmIcon} />
                  </WarmProgressBadge>
                )}
                {item.strength === "HOT" && (
                  <HotProgressBadge>
                    <SVGIconBadge component={HotIcon} />
                  </HotProgressBadge>
                )}
              </>
            ) : (
              <Avatar
                size={48}
                src={`${item.avatar ? item.avatar : "/images/avatar1.png"}`}
              />
            )}
          </>
        }
        description={
          <div>
            <Info>
              <Info style={{ flexGrow: 4, flexFlow: "row wrap" }}>
                <InfoText style={{ flexGrow: 1.8 }}>
                  {authorRenderer ? authorRenderer(item) : <span>{item.author} </span>}
                  posted {parseTimestamp(item.timestamp)}
                  {item?.location ? (
                    <>
                      <InfoIcon
                        component={LocationIcon}
                        alt="Date"
                        style={{
                          margin: "0 0 0 6px",
                          fontSize: "14px",
                        }}
                      />
                      {item.location}
                    </>
                  ) : null}
                </InfoText>
                {!hideSource && (
                  <SourceText>
                    {item.source}
                    <SourceIcon
                      src={
                        `/images/sources/${item?.sourceType?.toLowerCase()}.png` ||
                        "/images/sources/forum.png"
                      }
                      onError={e => {
                        e.target.src = "/images/sources/forum.png"
                      }}
                    />
                  </SourceText>
                )}
              </Info>
            </Info>

            <ThreadTitle>
              {item?.threadTitle ? item.threadTitle : " "}
            </ThreadTitle>
            <DescriptionParagraph item={item} isMobile={false} id2={1} />
            <BottomInfo>
              <div>
                {item.tags.map((t, index) => (
                  <TagColored key={index} color={TagColors(t)}>
                    {capitalize(t)}
                  </TagColored>
                ))}
              </div>
              <ButtonInfo>
                <TooltipButton
                  tooltip="Remove"
                  shape="circle"
                  onClick={() => {
                    item.status = ProspectStatus.REJECTED
                    updateStatus(item.id, ProspectStatus.REJECTED);
                  }}
                  component={
                    item.status === ProspectStatus.REJECTED
                      ? RemoveActive
                      : RemoveIcon
                  }
                  alt="Remove"
                />
                <TooltipButton
                  activeclass={savedActive}
                  active={
                    item.status === ProspectStatus.SAVED ? "true" : undefined
                  }
                  tooltip="Save"
                  shape="circle"
                  onClick={() => {
                    updateStatus(item.id, item.status === ProspectStatus.SAVED? ProspectStatus.VIEWED : ProspectStatus.SAVED);
                  }}
                  component={
                    item.status === ProspectStatus.SAVED
                      ? StarIconActive
                      : StarIcon
                  }
                  alt="Favorite"
                />
                <ResponseButton item={item} updateStatus={updateStatus} />
              </ButtonInfo>
            </BottomInfo>
          </div>
        }
      />
    </ProspectItem>
  )
}

FeedPost.propTypes = {
  id: PropTypes.number,
  body: PropTypes.string,
  url: PropTypes.string,
  author: PropTypes.string,
  authorProfileUrl: PropTypes.string,
  location: PropTypes.string,
  timestamp: PropTypes.string,
  source: PropTypes.string,
  status: PropTypes.string,
  sourceType: PropTypes.string,
  sourceId: PropTypes.number,
  sourceUrl: PropTypes.string,
  tags: PropTypes.string,
  threadTitle: PropTypes.string,
  review: PropTypes.string,
}
