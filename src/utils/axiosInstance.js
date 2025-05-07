import axios from 'axios';
import { BASE_URL } from '../config';
import decodeCookie from './decodeCookie';

const apiCall = axios.create({
    baseURL: BASE_URL,
    withCredentials: true
});

// Add a request interceptor to set the CSRF token
apiCall.interceptors.request.use(
    (config) => {
        const auth = decodeCookie();
        if (auth && auth._id) {
            config.headers['X-CSRF-TOKEN'] = auth._id;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiCall;