import React, { useState } from 'react';
import { Menu } from 'antd';

export const presetMenu = (items, onClick) => {
  return (
    <Menu onClick={onClick}>
      {items && items.length > 0 ? (
        items.map(item => <Menu.Item key={item.id}>{item.name}</Menu.Item>)
      ) : (
        <Menu.Item disabled>No Presets</Menu.Item>
      )}
    </Menu>
  )
}