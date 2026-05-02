const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const parseJson = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
};

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export const blogApi = {
  list: async (token, status) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const response = await fetch(`${API_BASE_URL}/api/blogs${query}`, {
      headers: authHeaders(token),
    });
    return parseJson(response);
  },

  getById: async (token, blogId) => {
    const response = await fetch(`${API_BASE_URL}/api/blogs/${blogId}`, {
      headers: authHeaders(token),
    });
    return parseJson(response);
  },

  create: async (token, payload) => {
    const response = await fetch(`${API_BASE_URL}/api/blogs`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    return parseJson(response);
  },

  update: async (token, blogId, payload) => {
    const response = await fetch(`${API_BASE_URL}/api/blogs/${blogId}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    return parseJson(response);
  },

  publish: async (token, blogId) => {
    const response = await fetch(`${API_BASE_URL}/api/blogs/${blogId}/publish`, {
      method: 'POST',
      headers: authHeaders(token),
    });
    return parseJson(response);
  },

  remove: async (token, blogId) => {
    const response = await fetch(`${API_BASE_URL}/api/blogs/${blogId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
    return parseJson(response);
  },

  listPublished: async ({ q = '', period = 'all', sort = 'newest', tag = '', token } = {}) => {
    const query = new URLSearchParams({ q, period, sort, tag });

    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/blogs/public?${query.toString()}`, {
      headers,
    });
    return parseJson(response);
  },

  getPublishedById: async (blogId, token) => {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/blogs/public/${blogId}`, { headers });
    return parseJson(response);
  },

  togglePublishedLike: async (token, blogId) => {
    const response = await fetch(`${API_BASE_URL}/api/blogs/public/${blogId}/like`, {
      method: 'POST',
      headers: authHeaders(token),
    });
    return parseJson(response);
  },

  togglePublishedDislike: async (token, blogId) => {
    const response = await fetch(`${API_BASE_URL}/api/blogs/public/${blogId}/dislike`, {
      method: 'POST',
      headers: authHeaders(token),
    });
    return parseJson(response);
  },

  listComments: async (blogId) => {
    const response = await fetch(`${API_BASE_URL}/api/blogs/public/${blogId}/comments`);
    return parseJson(response);
  },

  addComment: async (token, blogId, content) => {
    const response = await fetch(`${API_BASE_URL}/api/blogs/public/${blogId}/comments`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ content }),
    });
    return parseJson(response);
  },

  updateComment: async (token, blogId, commentId, content) => {
    const response = await fetch(`${API_BASE_URL}/api/blogs/public/${blogId}/comments/${commentId}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ content }),
    });
    return parseJson(response);
  },

  removeComment: async (token, blogId, commentId) => {
    const response = await fetch(`${API_BASE_URL}/api/blogs/public/${blogId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
    return parseJson(response);
  },

  uploadImage: async (token, file) => {
    const form = new FormData();
    form.append('image', file);
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    return parseJson(response);
  },
};
