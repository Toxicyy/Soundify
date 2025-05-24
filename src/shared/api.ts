const BASEURL = 'http://localhost:5000'


export const api = {
    register: async (email: string, password: string, name: string, username: string) => {
        return await fetch(`${BASEURL}/auth/registration`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, name, username })
        })
    },
    login: async (email: string, password: string) => {
        return fetch(`${BASEURL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
    }
}
