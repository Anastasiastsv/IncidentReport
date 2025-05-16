import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import IncidentService from "../services/incident.service";
import { Bar, Pie } from "react-chartjs-2";
import EventBus from "../common/EventBus";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";
import AuthService from "../services/auth.service";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function BoardModerator() {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    unpublished: 0,
    byType: [],
    byStatus: [],
    byYear: []
  });
  
  const [allIncidents, setAllIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);
  
  const [barChartData, setBarChartData] = useState({
    labels: ["Опубликованные", "Неопубликованные"],
    datasets: [
      {
        label: "Количество инцидентов",
        data: [0, 0],
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(255, 99, 132, 0.6)"
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(255, 99, 132, 1)"
        ],
        borderWidth: 1
      }
    ]
  });
  
  const [pieChartData, setPieChartData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
          "#FF9F40", "#8AC24A", "#00BCD4", "#E040FB", "#CDDC39",
          "#FF5722", "#607D8B", "#9C27B0", "#3F51B5", "#009688"
        ],
        hoverBackgroundColor: [
          "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
          "#FF9F40", "#8AC24A", "#00BCD4", "#E040FB", "#CDDC39",
          "#FF5722", "#607D8B", "#9C27B0", "#3F51B5", "#009688"
        ]
      }
    ]
  });

  useEffect(() => {
    if (location.state?.success) {
      alert(location.state.success);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      setIsAdmin(currentUser.roles.includes("ROLE_ADMIN"));
    }
    loadAllData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [statusFilter, typeFilter, dateFilter, allIncidents]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchData(),
        fetchStats()
      ]);
      setDbConnected(true);
    } catch (error) {
      console.error("Ошибка при загрузке данных:", error);
      setDbConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const response = isAdmin 
        ? await IncidentService.getAllAdmin()
        : await IncidentService.getAll();
      
      setAllIncidents(response.data);
    } catch (error) {
      console.error("Ошибка при загрузке инцидентов:", error);
      if (error.response && error.response.status === 401) {
        EventBus.dispatch("logout");
      }
      throw error;
    }
  };

  const fetchStats = async () => {
    try {
      const response = await IncidentService.getStats();
      const statsData = response.data;

      setStats(statsData);
      updateCharts(statsData);
    } catch (error) {
      console.error("Ошибка при загрузке статистики:", error);
      if (error.response && error.response.status === 401) {
        EventBus.dispatch("logout");
      }
      throw error;
    }
  };

  const updateCharts = (statsData) => {
    setBarChartData(prev => ({
      ...prev,
      datasets: [
        {
          ...prev.datasets[0],
          data: [statsData.published, statsData.unpublished]
        }
      ]
    }));
    
    setPieChartData({
      labels: statsData.byType.map(item => item.type || 'Не указан'),
      datasets: [
        {
          ...pieChartData.datasets[0],
          data: statsData.byType.map(item => item.count)
        }
      ]
    });
  };

  const applyFilters = () => {
    let filtered = allIncidents;

    if (statusFilter !== "all") {
      const isPublished = statusFilter === "published";
      filtered = filtered.filter(incident => incident.published === isPublished);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(incident => incident.type === typeFilter);
    }

    if (dateFilter) {
      const selectedDate = new Date(dateFilter).setHours(0, 0, 0, 0);
      filtered = filtered.filter(incident => new Date(incident.date).setHours(0, 0, 0, 0) === selectedDate);
    }

    setFilteredIncidents(filtered);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handleTypeFilterChange = (event) => {
    setTypeFilter(event.target.value);
  };

  const handleDateFilterChange = (event) => {
    setDateFilter(event.target.value);
  };


  const handleTogglePublish = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      await IncidentService.update(id, { published: newStatus });
      await loadAllData();
      alert(`Инцидент успешно ${newStatus ? 'опубликован' : 'снят с публикации'}`);
    } catch (error) {
      console.error("Ошибка при обновлении статуса:", error);
      alert("Произошла ошибка при изменении статуса");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Вы уверены, что хотите удалить этот инцидент?")) {
      try {
        await IncidentService.delete(id);
        await loadAllData();
        alert("Инцидент успешно удален");
      } catch (error) {
        console.error("Ошибка при удалении:", error);
        alert("Произошла ошибка при удалении");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="text-center my-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
        </div>
      </div>
    );
  }
  // Проверка на подключение к БД
  if (!dbConnected) {
    return (
      <div className="container text-center">
        <h3>No token provided</h3>
      </div>
    );
  }
  return (
    <div className="container">
      <h3 className="my-4">Панель {isAdmin ? 'администратора' : 'модератора'} инцидентов</h3>
      
      {/* Фильтрация инцидентов */}
      <div className="mb-4">
        <label htmlFor="statusFilter" className="form-label">Фильтр по статусу:</label>
        <select id="statusFilter" className="form-select" value={statusFilter} onChange={handleStatusFilterChange}>
          <option value="all">Все</option>
          <option value="published">Опубликованные</option>
          <option value="unpublished">Не опубликованные</option>
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="typeFilter" className="form-label">Фильтр по типу:</label>
        <select id="typeFilter" className="form-select" value={typeFilter} onChange={handleTypeFilterChange}>
          <option value="all">Все</option>
          {stats.byType.map(type => (
            <option key={type.type} value={type.type}>{type.type}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="dateFilter" className="form-label">Фильтр по дате:</label>
        <input
          type="date"
          id="dateFilter"
          className="form-control"
          value={dateFilter}
          onChange={handleDateFilterChange}
        />
      </div>

      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card text-white bg-primary mb-3">
            <div className="card-body">
              <h5 className="card-title">Всего инцидентов</h5>
              <p className="card-text display-6">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white bg-success mb-3">
            <div className="card-body">
              <h5 className="card-title">Опубликовано</h5>
              <p className="card-text display-6">{stats.published}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white bg-warning mb-3">
            <div className="card-body">
              <h5 className="card-title">Не опубликовано</h5>
              <p className="card-text display-6">{stats.unpublished}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Статус публикации</h5>
              <div style={{ height: "300px" }}>
                <Bar
                  data={barChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Распределение по типам</h5>
              <div style={{ height: "300px" }}>
                <Pie
                  data={pieChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Список всех инцидентов</h5>
          <button 
            className="btn btn-sm btn-primary"
            onClick={() => navigate("/incidents/new")}
          >
            Создать новый
          </button>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Название</th>
                  <th>Тип</th>
                  <th>Статус</th>
                  <th>Дата</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map(incident => (
                  <tr key={incident.id}>
                    <td>#{incident.id}</td>
                    <td>{incident.title}</td>
                    <td>{incident.type || 'Не указан'}</td>
                    <td>
                      <span className={`badge bg-${incident.published ? 'success' : 'warning'}`}>
                        {incident.published ? 'Опубликован' : 'Черновик'}
                      </span>
                    </td>
                    <td>
                      {new Date(incident.date).toLocaleDateString()}
                    </td>
                    <td>
                      
                      <button 
                        className={`btn btn-sm me-2 ${incident.published ? 'btn-outline-warning' : 'btn-outline-success'}`}
                        onClick={() => handleTogglePublish(incident.id, incident.published)}
                        title={incident.published ? 'Снять с публикации' : 'Опубликовать'}
                      >
                        {incident.published 
                          ? <i className="bi bi-eye-slash"></i> 
                          : <i className="bi bi-eye"></i>}
                      </button>
                      {isAdmin && (
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(incident.id)}
                          title="Удалить"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BoardModerator;