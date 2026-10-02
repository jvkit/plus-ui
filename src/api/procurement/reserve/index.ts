import request from '@/utils/request';
import { ReserveAccountVO, ReserveForm, ReserveOptionVO, ReserveSummaryVO, ReserveUserOption } from './types';
import type { AxiosPromise } from '@/utils/api-types';

// 查询备用金账户列表（额度/已占用/可用/未报销笔数/已回笼）
export function listReserve(): AxiosPromise<ReserveAccountVO[]> {
  return request({
    url: '/procurement/reserve/list',
    method: 'get'
  });
}

// 备用金汇总（总额度/已占用/可用/已回笼）
export function getReserveSummary(): AxiosPromise<ReserveSummaryVO> {
  return request({
    url: '/procurement/reserve/summary',
    method: 'get'
  });
}

// 新增备用金账户
export function addReserve(data: ReserveForm) {
  return request({
    url: '/procurement/reserve',
    method: 'post',
    data: data
  });
}

// 修改备用金额度/备注
export function updateReserve(data: ReserveForm) {
  return request({
    url: '/procurement/reserve',
    method: 'put',
    data: data
  });
}

// 选人下拉（新增账户用）
export function listReserveUserOptions(): AxiosPromise<ReserveUserOption[]> {
  return request({
    url: '/procurement/reserve/userOptions',
    method: 'get'
  });
}

// 备用金平铺选人选项（登录即可，普通用户可用；额度/已用/可用与账户表一致）
export function reserveOptions(): AxiosPromise<ReserveOptionVO[]> {
  return request({
    url: '/procurement/reserve/options',
    method: 'get'
  });
}
