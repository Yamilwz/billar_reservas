// En producción (Render) el frontend y backend corren en el mismo servidor,
// pero si se abre localmente con file://, usamos localhost por defecto.
const isFileProtocol = window.location.protocol === 'file:';
const API_URL = isFileProtocol ? 'http://localhost:3000/api' : `${window.location.origin}/api`;

const api = {
    async request(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = { method, headers };
        if (body) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data.error ? `${data.message}: ${data.error}` : (data.message || 'API Error');
            throw new Error(errorMsg);
        }

        return data;
    },

    auth: {
        login: (credentials) => api.request('/auth/login', 'POST', credentials),
        register: (userData) => api.request('/auth/register', 'POST', userData)
    },
    tables: {
        getAll: () => api.request('/tables'),
        updateStatus: (id, status) => api.request(`/tables/${id}`, 'PUT', { status })
    },
    reservations: {
        getSlots: (date) => api.request(`/reservations/slots?date=${date}`),
        create: (data) => api.request('/reservations', 'POST', data),
        assignTime: (data) => api.request('/reservations/assign-time', 'POST', data),
        getMy: () => api.request('/reservations/my-reservations'),
        getAll: (date) => api.request(`/reservations${date ? `?date=${date}` : ''}`),
        updateStatus: (id, status) => api.request(`/reservations/${id}`, 'PUT', { status })
    },
    products: {
        getAll: () => api.request('/products'),
        create: (data) => api.request('/products', 'POST', data),
        update: (id, data) => api.request(`/products/${id}`, 'PUT', data),
        delete: (id) => api.request(`/products/${id}`, 'DELETE')
    },
    sales: {
        create: (data) => api.request('/sales', 'POST', data),
        getDaily: (date) => api.request(`/sales/daily${date ? `?date=${date}` : ''}`)
    },
    users: {
        getAll: () => api.request('/users'),
        delete: (id) => api.request(`/users/${id}`, 'DELETE')
    }
};

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

function checkAuth(roleRequired = null) {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user) {
        window.location.href = '/login.html';
        return null;
    }

    if (roleRequired && user.role !== roleRequired) {
        window.location.href = '/index.html';
        return null;
    }

    return user;
}

// Set up UI based on auth state
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const authLinks = document.getElementById('auth-links');
    if (authLinks) {
        if (user) {
            let links = `
                <li class="nav-item"><a class="nav-link" href="#">Hola, ${user.name}</a></li>
                <li class="nav-item"><a class="nav-link" href="javascript:void(0)" onclick="logout()">Salir</a></li>
            `;
            if (user.role === 'admin') {
                links = `<li class="nav-item"><a class="nav-link" href="/admin_reservations.html">Admin Panel</a></li>` + links;
            } else {
                links = `<li class="nav-item"><a class="nav-link" href="/profile.html">Mis Reservas</a></li>` + links;
            }
            authLinks.innerHTML = links;
        }
    }
});
