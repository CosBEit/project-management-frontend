import { combineReducers } from "@reduxjs/toolkit"

const initialState = {
    loginEmail: '',
    userRole: '',
}

const LoginEmailReducer = (state = initialState.loginEmail, action) => {
    switch (action.type) {
        case 'LoginEmail':
            return action.payload || state
        default:
            return state
    }
}

const UserRoleReducer = (state = initialState.userRole, action) => {
    switch (action.type) {
        case 'UserRole':
            return action.payload || state
        default:
            return state
    }
}

const rootReducer = combineReducers({
    LoginEmailReduxState: LoginEmailReducer,
    UserRoleReduxState: UserRoleReducer
})

export default rootReducer