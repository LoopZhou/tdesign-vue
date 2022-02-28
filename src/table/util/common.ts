import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import get from 'lodash/get';
import {
  PrimaryTableCol, RowClassNameParams, TableRowData, TdBaseTableProps,
} from '../type';
import { ClassName, HTMLElementAttributes } from '../../common';

export function toString(obj: any): string {
  return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
}

export function debounce<T = any>(fn: Function, delay = 200): () => void {
  let timer: ReturnType<typeof setTimeout>;
  return function newFn(this: T, ...args: Array<any>): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
  };
}

export interface FormatRowAttributesParams {
  row: TableRowData;
  rowIndex: number;
  type: 'body' | 'foot';
}

// 行属性
export function formatRowAttributes(attributes: TdBaseTableProps['rowAttributes'], params: FormatRowAttributesParams) {
  if (!attributes) return undefined;
  const attrList = attributes instanceof Array ? attributes : [attributes];
  let result: HTMLElementAttributes = {};
  for (let i = 0; i < attrList.length; i++) {
    const attrItem = attrList[i];
    if (!attrItem) continue;
    const attrProperty = isFunction(attrItem) ? attrItem(params) : attrItem;
    result = Object.assign(result, attrProperty);
  }
  return result;
}

// 行类名，['A', 'B']，[() => 'A', () => 'B']
export function formatRowClassNames(
  rowClassNames: TdBaseTableProps['rowClassName'],
  params: RowClassNameParams<TableRowData>,
  rowKey: string,
): ClassName {
  const rowClassList = rowClassNames instanceof Array ? rowClassNames : [rowClassNames];
  const { row, rowIndex } = params;
  // 自定义行类名
  let customClasses: ClassName = [];
  for (let i = 0, len = rowClassList.length; i < len; i++) {
    const rName = rowClassList[i];
    let tClass = isFunction(rName) ? rName(params) : rName;
    if (typeof tClass === 'object') {
      // 根据下标设置行类名
      tClass[rowIndex] && (tClass = tClass[rowIndex]);
      // 根据行唯一标识设置行类名
      const rowId = get(row, rowKey || 'id');
      tClass[rowId] && (tClass = tClass[rowId]);
    }
    customClasses = customClasses.concat(tClass);
  }
  return customClasses;
}

export function filterDataByIds(
  data: Array<object> = [],
  ids: Array<string | number> = [],
  byId = 'id',
): Array<object> {
  return data.filter((d: Record<string, any> = {}) => ids.includes(d[byId]));
}

export const INNER_PRE_NAME = '@@inner-';

export enum SCROLL_DIRECTION {
  X = 'x',
  Y = 'y',
  UNKNOWN = 'unknown',
}

let preScrollLeft: any;
let preScrollTop: any;

export const getScrollDirection = (scrollLeft: number, scrollTop: number): SCROLL_DIRECTION => {
  let direction = SCROLL_DIRECTION.UNKNOWN;
  if (preScrollTop !== scrollTop) {
    direction = SCROLL_DIRECTION.Y;
  } else if (preScrollLeft !== scrollLeft) {
    direction = SCROLL_DIRECTION.X;
  }
  preScrollTop = scrollTop;
  preScrollLeft = scrollLeft;
  return direction;
};

export const getRecord = (record: Record<any, any>) => {
  if (!record) {
    return record;
  }
  const result = {};
  Object.keys(record).forEach((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(record, key);
    descriptor
      && Reflect.defineProperty(result, key, {
        set(val) {
          descriptor.set(val);
        },
        get() {
          console.warn('The parameter `record` will be deprecated, please use `row` instead');
          return descriptor.get();
        },
      });
  });
  return result;
};

// 该方法主要用于排序、过滤等需要调整表头的功能
export function getTitle(vm: Vue, column: PrimaryTableCol, colIndex: number) {
  let result = null;
  if (isFunction(column.title)) {
    result = column.title(vm.$createElement, { col: column, colIndex });
  } else if (isString(column.title)) {
    result = vm.$scopedSlots[column.title] ? vm.$scopedSlots[column.title](null) : column.title;
  } else if (isFunction(column.render)) {
    result = column.render(vm.$createElement, {
      type: 'title',
      col: column,
      colIndex,
      row: undefined,
      rowIndex: undefined,
    });
  }
  return result;
}

export interface GetCellParams<T extends TableRowData = TableRowData> {
  row: T;
  rowIndex: number;
  col: PrimaryTableCol;
  colIndex: number;
}

// 该方法主要用于设置单元格（树形结构等功能会使用）
export function getCell(vm: Vue, p: GetCellParams) {
  const { col, row } = p;
  let result = null;
  if (isFunction(col.cell)) {
    result = col.cell(vm.$createElement, { ...p });
  } else if (isString(col.cell)) {
    result = vm.$scopedSlots[col.cell] ? vm.$scopedSlots[col.cell](p) : row[col.colKey];
  } else if (isFunction(col.render)) {
    result = col.render(vm.$createElement, {
      type: 'cell',
      ...p,
    });
  }
  return result || row[col.colKey];
}

export function isRowSelectedDisabled(
  selectColumn: PrimaryTableCol,
  row: Record<string, any>,
  rowIndex: number,
): boolean {
  let disabled = isFunction(selectColumn.disabled) ? selectColumn.disabled({ row, rowIndex }) : selectColumn.disabled;
  if (selectColumn.checkProps) {
    if (isFunction(selectColumn.checkProps)) {
      disabled = disabled || selectColumn.checkProps({ row, rowIndex }).disabled;
    } else if (selectColumn.checkProps === 'object') {
      disabled = disabled || selectColumn.checkProps.disabled;
    }
  }
  return !!disabled;
}
