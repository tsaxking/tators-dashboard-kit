import { browser } from "$app/environment";

if (browser) {
    const tabSession = sessionStorage.getItem('tab-session');
    if (!tabSession) {
        sessionStorage.setItem('tab-session', Date.now().toString());
    }

    window.addEventListener('beforeunload', () => {
        sessionStorage.removeItem('tab-session');
    });

    // add a cookie
    document.cookie = 'tab-session=' + sessionStorage.getItem('tab-session') + '; path=/';
}