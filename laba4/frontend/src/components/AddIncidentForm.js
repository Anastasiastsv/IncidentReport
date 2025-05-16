// src/components/AddIncidentForm.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import IncidentService from "../services/incident.service";

function AddIncidentForm() {
  const navigate = useNavigate();
  
  const [incident, setIncident] = useState({
    title: "",
    description: "",
    type: "",
    date: new Date().toISOString().split('T')[0],
    published: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setIncident(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      await IncidentService.create(incident);
      navigate("/mod", { state: { success: "Инцидент успешно создан!" } });
    } catch (err) {
      console.error("Ошибка при создании инцидента:", err);
      setError(err.response?.data?.message || "Произошла ошибка при создании инцидента");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mt-4">
      <h3>Создать новый инцидент</h3>
      
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="title" className="form-label">Название</label>
          <input
            type="text"
            className="form-control"
            id="title"
            name="title"
            value={incident.title}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="description" className="form-label">Описание</label>
          <textarea
            className="form-control"
            id="description"
            name="description"
            rows="3"
            value={incident.description}
            onChange={handleChange}
            required
          ></textarea>
        </div>
        
        <div className="mb-3">
          <label htmlFor="type" className="form-label">Тип инцидента</label>
          <select
            className="form-select"
            id="type"
            name="type"
            value={incident.type}
            onChange={handleChange}
            required
          >
            <option value="">Выберите тип</option>
            <option value="Технический">Технический</option>
            <option value="Безопасность">Безопасность</option>
            <option value="Персонал">Персонал</option>
            <option value="Другое">Другое</option>
          </select>
        </div>
        
        <div className="mb-3">
          <label htmlFor="date" className="form-label">Дата инцидента</label>
          <input
            type="date"
            className="form-control"
            id="date"
            name="date"
            value={incident.date}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-3 form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id="published"
            name="published"
            checked={incident.published}
            onChange={handleChange}
          />
          <label className="form-check-label" htmlFor="published">
            Опубликовать сразу
          </label>
        </div>
        
        <div className="d-flex justify-content-between">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/mod")}
            disabled={isSubmitting}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Сохранение...
              </>
            ) : "Создать инцидент"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddIncidentForm;