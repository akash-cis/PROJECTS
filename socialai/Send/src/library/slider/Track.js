import React from "react"
const Track = ({ source, target, getTrackProps }) => (
    <div
        style={{
            position: 'absolute',
            height: 5,
            zIndex: 1,
            // marginTop: 25,
            backgroundColor: '#546C91',
            borderRadius: 5,
            cursor: 'pointer',
            left: `${source.percent}%`,
            width: `${target.percent - source.percent}%`,
        }}
        {...getTrackProps()} // this will set up events if you want it to be clickeable (optional)
    />
)
export default Track