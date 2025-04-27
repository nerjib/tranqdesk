import React from "react";
import { Menu, Dropdown } from "antd";
import { MoreOutlined } from "@ant-design/icons";

export default function AntDropdown({
  children,
  placement,
  handleDropdownAction,
  dropDownOptions = [],
  userId,
  trigger,
  isArrow,
}) {
  return (
    <Dropdown
      overlay={
        <Menu>
          {dropDownOptions.map((item, index) => (
            <Menu.Item key={index}>
              <span
                key={index}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleDropdownAction(item, userId)}
              >
                {item}
              </span>
            </Menu.Item>
          ))}
        </Menu>
      }
      placement={placement || "bottomRight"}
      arrow={isArrow || false}
      trigger={[trigger || "click"]}
    >
      {children || <MoreOutlined  style={{ fontSize: "30px" }} />}
    </Dropdown>
  );
}
