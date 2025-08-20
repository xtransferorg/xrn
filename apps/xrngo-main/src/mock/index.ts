import {uniqueId} from 'lodash';

export interface DetailItem {
  id: string;
  createAt: string;
  remark?: string;
}

export const mockDetail = <T extends DetailItem = DetailItem>(): T => {
  return {
    id: uniqueId(),
    createAt: new Date().toISOString(),
    remark: '',
  } as T;
};
