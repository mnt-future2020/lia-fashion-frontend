
import Cookies from 'js-cookie';

export const setAuthToken = (token) => {
    Cookies.set('admin-token', token, { path: '/' });
};

export const getAuthToken = () => {
    return Cookies.get('admin-token');
};

export const removeAuthToken = () => {
    Cookies.remove('admin-token', { path: '/' });
    document.dispatchEvent(new Event('tokenRemoved'));
};

export const isAuthenticated = () => {
    return !!getAuthToken();
};

export const setUserToken = (token) => {
    Cookies.set('user-token', token, {
        expires: 7,
        path: '/',
        sameSite: 'lax'
    });
};

export const getUserToken = () => {
    return Cookies.get('user-token');
};

export const removeUserToken = () => {
    Cookies.remove('user-token', { path: '/' });
};
