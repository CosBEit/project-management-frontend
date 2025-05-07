import { Navigate } from 'react-router-dom'
import { LoginEmailAction } from '../redux/actions.js'
import { useDispatch } from 'react-redux'
import decodeCookie from './decodeCookie.js'

function ProtectedRoute({ children }) {
    const authenticated = !!decodeCookie()
    const dispatch = useDispatch()

    if (authenticated) {
        dispatch(LoginEmailAction(authenticated?.email))
    }

    return authenticated ? children : <Navigate to="/" />
}

export default ProtectedRoute