import React, { useState } from 'react';
import { ActionGroup, ButtonCustom } from '../basicComponents';
import { Input } from 'antd';

export const PresetModalField = ({item, onConfirm, onDelete}) => {
  const [name, setName] = useState(item.name);
  return (
    <ActionGroup style={{margin: 10}}>
      <Input
        style={{ marginRight: "8px" }}
        placeholder="Enter preset name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <ButtonCustom
        disabled={!name?.trim()}
        onClick={() => onConfirm({...item, name}, false)}
      >
        Update
      </ButtonCustom>
      <ButtonCustom onClick={() => onDelete({...item, name: name.trim()}, true)}>
        Delete
      </ButtonCustom>
      <br />
      <br />
    </ActionGroup>
  );
}