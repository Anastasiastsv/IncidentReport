import axios from "axios";
import authHeader from "./auth-header";

const API_URL = "http://localhost:8080/api/incidents";

class IncidentService {
  // Для обычных пользователей
  getAll() {
    return axios.get(API_URL, { headers: authHeader() });
  }

  // Для администраторов (все инциденты)
  getAllAdmin() {
    return axios.get(`${API_URL}/admin/all`, { headers: authHeader() });
  }

  get(id) {
    return axios.get(`${API_URL}/${id}`, { headers: authHeader() });
  }

  create(data) {
    return axios.post(API_URL, data, { headers: authHeader() });
  }

  update(id, data) {
    return axios.put(`${API_URL}/${id}`, data, { headers: authHeader() });
  }

  delete(id) {
    return axios.delete(`${API_URL}/${id}`, { headers: authHeader() });
  }

  // Поиск по названию (исправленная версия)
  findByTitle(title) {
    return axios.get(`${API_URL}?title=${title}`, { headers: authHeader() });
  }

  // Публичные методы (без авторизации)
  getPublished() {
    return axios.get(`${API_URL}/public/published`);
  }

  getStats() {
    return axios.get(`${API_URL}/public/stats`);
  }

  // Дополнительные администраторские методы
  deleteAll() {
    return axios.delete(API_URL, { headers: authHeader() });
  }
}

export default new IncidentService();