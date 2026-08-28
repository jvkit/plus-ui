import request from '@/utils/request';
import { IssueForm, IssueQuery, IssueVO } from './types';
import type { AxiosPromise } from '@/utils/api-types';

// 查询领用申请列表
export function listIssue(query: IssueQuery): AxiosPromise<IssueVO[]> {
  return request({
    url: '/procurement/issue/list',
    method: 'get',
    params: query
  });
}

// 查询领用申请详细
export function getIssue(id: string | number): AxiosPromise<IssueVO> {
  return request({
    url: '/procurement/issue/' + id,
    method: 'get'
  });
}

// 新增领用申请
export function addIssue(data: IssueForm) {
  return request({
    url: '/procurement/issue',
    method: 'post',
    data: data
  });
}

// 修改领用申请
export function updateIssue(data: IssueForm) {
  return request({
    url: '/procurement/issue',
    method: 'put',
    data: data
  });
}

// 删除领用申请
export function delIssue(id: string | number | Array<string | number>) {
  return request({
    url: '/procurement/issue/' + id,
    method: 'delete'
  });
}

// 审批领用申请（通过/拒绝）
export function approveIssue(data: IssueForm) {
  return request({
    url: '/procurement/issue/approve',
    method: 'post',
    data: data
  });
}

// 提交领用申请并启动流程（发起人→仓库管理员→结束）
export function submitIssue(data: IssueForm) {
  return request({
    url: '/procurement/issue/submit',
    method: 'post',
    data: data
  });
}

// 导出领用申请
export function exportIssue(query: IssueQuery) {
  return request({
    url: '/procurement/issue/export',
    method: 'post',
    params: query,
    responseType: 'blob'
  });
}
