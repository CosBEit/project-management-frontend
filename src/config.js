// API URLs
export const BASE_URL = import.meta.env.VITE_ENVIRONMENT === "development" ? "http://localhost:8000/api/v1" : import.meta.env.VITE_BASE_URL + "/api/v1";
export const LOGIN_URL = `/auth/login`;
export const LOGOUT_URL = `/auth/logout`;
export const CREATE_ACCOUNT_URL = `/auth/user/create`;
export const FORGOT_PASSWORD_URL = `/auth/forgot-password`;
export const RESET_PASSWORD_URL = `/auth/reset-password`;

// Project API URLs
export const CREATE_PROJECT_URL = `/projects/create`;
export const GET_ALL_PROJECTS_URL = `/projects`;
export const UPDATE_PROJECT_URL = (projectId) => `/projects/${projectId}`;
export const DELETE_PROJECT_URL = (projectId) => `/projects/${projectId}`;

// Task API URLs
export const CREATE_TASK_URL = `/tasks`;
export const GET_TASKS_URL = `/tasks`;
export const GET_TASK_URL = '/tasks';
export const UPDATE_TASK_URL = '/tasks';
export const UPDATE_TASK_DATES_URL = `/tasks/update-dates`;
export const DELETE_TASK_URL = `/tasks`;
export const CREATE_TASK_LINKS_URL = `/tasks/links`;
export const GET_TASK_LINKS_URL = `/tasks/links`;
export const GET_ACTIVE_USERS_URL = 'users/active';
export const ADD_USER_URL = `/auth/admin/add/user`
export const GET_USERS_URL = `/auth/users`
export const UPDATE_USER_URL = `/auth/users`
export const CREATE_COMMENT_URL = '/tasks/comment';
export const GET_COMMENTS_URL = '/tasks/comments';

