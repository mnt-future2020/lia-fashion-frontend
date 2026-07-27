
import Cookies from 'js-cookie';

/**
 * Shared cookie attributes for auth tokens.
 *
 * `secure` is applied only when the page is actually served over HTTPS — setting it
 * unconditionally would make the browser silently drop the cookie on http://localhost
 * and break local development sign-in.
 *
 * NOTE: these cookies cannot be httpOnly. They are written by client-side JS and read back
 * by the axios interceptor, so JS must be able to see them. Making them httpOnly would
 * require moving token issuance to a server route / Next.js route handler and is a larger
 * architectural change, tracked separately.
 */
const cookieOptions = (extra = {}) => {
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

    return {
        path: '/',
        sameSite: 'lax',
        ...(isHttps ? { secure: true } : {}),
        ...extra,
    };
};

export const setAuthToken = (token) => {
    // No `expires` — deliberately a session cookie, as before.
    Cookies.set('admin-token', token, cookieOptions());
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
    Cookies.set('user-token', token, cookieOptions({ expires: 7 }));
};

export const getUserToken = () => {
    return Cookies.get('user-token');
};

export const removeUserToken = () => {
    Cookies.remove('user-token', { path: '/' });
};
