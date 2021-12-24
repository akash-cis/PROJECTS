import React from "react"

const Handle = ({
    handle: { id, value, percent },
    getHandleProps
}) => (
        <div
            style={{
                left: `${percent}%`,
                position: 'absolute',
                marginLeft: -5,
                marginTop: -5,
                zIndex: 2,
                width: 15,
                height: 15,
                border: 0,
                textAlign: 'center',
                cursor: 'pointer',
                borderRadius: '50%',
                backgroundColor: '#2C4870',
                color: '#333',
            }}
            {...getHandleProps(id)}
        >
            <div style={{ fontFamily: 'Roboto', fontSize: 11, marginTop: -35 }}>
                {/* {value} */}
            </div>
        </div>
    )
export default Handle