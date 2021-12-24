import React, { useContext } from 'react'
// import { Slider as CompoundSlider, Handles, Tracks, Rail, Ticks } from 'react-compound-slider'
import { Slider as CompoundSlider, Rail, Handles, Tracks, Ticks } from 'react-compound-slider'
import Handle from './Handle'
import Tick from './Tick'
import Track from './Track'

const sliderStyle = {
    position: 'relative',
    width: '200px',
    // border: '1px solid steelblue',
}

const railStyle = {
    position: 'absolute',
    width: '100%',
    height: 5,
    // marginTop: 25,
    // borderRadius: 5,
    backgroundColor: '#8B9CB6',
}

const Slider = props => {
    return (
        <CompoundSlider rootStyle={sliderStyle} domain={[0, 1]} values={[0, 1]} step={0.01} mode={2} {...props} css={` display: inline-block; margin-right: 20px; vertical-align: bottom `}>
            <Rail>
                {({ getRailProps }) => (
                    <div style={railStyle} {...getRailProps()} />
                )}
            </Rail>
            <Handles>
                {({ handles, getHandleProps }) => (
                    <div className="slider-handles">
                        {handles.map(handle => (
                            <Handle
                                key={handle.id}
                                handle={handle}
                                getHandleProps={getHandleProps}
                            />
                        ))}
                    </div>
                )}
            </Handles>
            <Tracks right={false}>
                {({ tracks, getTrackProps }) => (
                    <div className="slider-tracks">
                        {tracks.map(({ id, source, target }) => (
                            <Track
                                key={id}
                                source={source}
                                target={target}
                                getTrackProps={getTrackProps}
                            />
                        ))}
                    </div>
                )}
            </Tracks>
            {/* <Ticks count={15}>
                {({ ticks }) => (
                    <div className="slider-ticks">
                        {ticks.map(tick => (
                            <Tick key={tick.id} tick={tick} count={ticks.length} />
                        ))}
                    </div>
                )}
            </Ticks> */}
        </CompoundSlider>
    )
}

export default Slider