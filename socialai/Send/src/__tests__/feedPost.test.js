import React from "react"
import { render } from "@testing-library/react"
import { FeedPost } from "../library/feedPost"

const item = {
  id: "30863794",
  body:
    "SILVER HYUNDAI SONATA HYBRID IN BRAND NEW MINT CONDITION. 1 OWNER AND NEVER BEEN IN A ACCIDENT (NO DOOR DINGS). GREAT ON GAS MILEGE(30 TO 40 MPGS). COMES WITH ADDED CLEAR BRA. CD PLAYER, BLUE TOOTH, KEYLESS ENTRY, AND START. HEATED SEATS, BACKUP CAMERA, CRUISE, AND NEW 80,000 MILE PIRELLI TIRES AND MANY EXTRAS. PLEASE CALL FOR MORE INFORMATION 801-557-2692.",
  url: "https://cars.ksl.com/listing/6240999",
  author: "Tom",
  authorProfileUrl: "https://cars.ksl.com/listing/6240999",
  location: "Salt Lake City, UT",
  timestamp: "2020-05-04T18:10:24.699164+00:00",
  source: "KSL Marketplace",
  status: "Viewed",
  sourceType: "MARKETPLACE",
  sourceId: 457,
  sourceUrl:
    "https://cars.ksl.com/search/postedTime/1DAY/sellerType/For+Sale+By+Owner/page/0/perPage/96",
  tags: ["Parts", "Hyundai", "Sonata"],
  threadTitle: "2015 Hyundai Sonata Hybrid - For Sale By Owner",
  review: null,
}

test("Render FeedPost without errors", () => {
  const { debug } = render(<FeedPost item={item} />)
})
