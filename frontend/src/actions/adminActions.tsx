import * as ActionTypes from 'constants/actionTypes';
import { IPagedItems, IUser, IUserDetails, IAgency, IRole } from 'interfaces';
import { IUserRecord } from 'pages/admin/users/interfaces/IUserRecord';

//Admin API actions
export interface IStoreUsersAction {
  type: typeof ActionTypes.STORE_USERS;
  pagedUsers: IPagedItems<IUser>;
}

export interface IUsersPaginationAction {
  type: typeof ActionTypes.STORE_USERS;
  pagedUsers: IPagedItems<IUser>;
}

export interface IGetUserAction {
  type: typeof ActionTypes.GET_USER;
  pagedUsers: IUser;
}

export interface IUpdateUserAction {
  type: typeof ActionTypes.UPDATE_USER;
  user: IUser;
}

export type SortDirection = 'asc' | 'desc';
export interface IUsersSort {
  sortBy: keyof IUserRecord;
  direction: SortDirection;
}

export interface ISortUsersAction {
  type: typeof ActionTypes.SORT_USERS;
  sort: IUsersSort;
}

export interface IFilterUsersAction {
  type: typeof ActionTypes.FILTER_USERS;
  filter: string[][];
}

export interface IUsersPageSizeAction {
  type: typeof ActionTypes.SET_USERS_PAGE_SIZE;
  size: number;
}

export interface IStoreUserDetail {
  type: typeof ActionTypes.STORE_USER_DETAILS;
  userDetail: IUserDetails;
}

export const storeUserDetail = (userDetail: IUserDetails) => ({
  type: ActionTypes.STORE_USER_DETAILS,
  // Payload below
  userDetail: userDetail,
});

export const storeUsers = (apiData: IPagedItems<IUser>) => ({
  type: ActionTypes.STORE_USERS,
  pagedUsers: { ...apiData, pageIndex: apiData.page - 1 },
});

export const updateUser = (user: IUser): IUpdateUserAction => ({
  type: ActionTypes.UPDATE_USER,
  user,
});

export const setUsersFilter = (filterList: string[][]): IFilterUsersAction => ({
  type: ActionTypes.FILTER_USERS,
  filter: filterList,
});

export const setUsersPageSize = (size: number) => ({
  type: ActionTypes.SET_USERS_PAGE_SIZE,
  size,
});

export const setUsersSort = (sort: IUsersSort): ISortUsersAction => ({
  type: ActionTypes.SORT_USERS,
  sort,
});

export interface IAddNewRoleAndAgency {
  agency: IAgency;
  role: IRole;
}
