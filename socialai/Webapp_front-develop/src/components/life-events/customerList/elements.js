import { Table } from "antd"
import styled from "styled-components"

export const CustomTable = styled(Table)`
  .ant-table-row {
    cursor: pointer;
    vertical-align: top;
  }
  .table-row-light {
    background-color: #ffffff;
  }
  .table-row-dark {
    /*color: #531dab;*/
    background: #f9f0ff;
    border-color: #d3adf7;
  }
  .table-row-lightblue {
    /*color: #531dab;*/
    background: #e6f7ff;
    border-color: #91d5ff;
  }
  @media only screen and (max-width: 1024px) {
    .ant-table-body {
      overflow-x: scroll;
      table {
        width: 1200px;
      }
    }
  }
`
