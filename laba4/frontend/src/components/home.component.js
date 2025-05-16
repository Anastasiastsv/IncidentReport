import React, { Component } from "react";
import IncidentService from "../services/incident.service";
import UserService from "../services/user.service";
import EventBus from "../common/EventBus";

export default class CombinedComponent extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      allIncidents: [],    // Полный список инцидентов
      filteredIncidents: [], // Отфильтрованный список
      currentIncident: null,
      currentIndex: -1,
      searchTitle: "",
      content: ""
    };

    // Привязка методов
    this.onChangeSearchTitle = this.onChangeSearchTitle.bind(this);
    this.retrieveIncidents = this.retrieveIncidents.bind(this);
    this.refreshList = this.refreshList.bind(this);
    this.setActiveIncident = this.setActiveIncident.bind(this);
    this.removeAllIncidents = this.removeAllIncidents.bind(this);
    this.searchTitle = this.searchTitle.bind(this);
  }

  componentDidMount() {
    UserService.getAdminBoard().then(
      response => {
        this.setState({
          content: response.data
        }, () => {
          this.retrieveIncidents();
        });
      },
      error => {
        this.setState({
          content:
            (error.response &&
              error.response.data &&
              error.response.data.message) ||
            error.message ||
            error.toString()
        });

        if (error.response && error.response.status === 401) {
          EventBus.dispatch("logout");
        }
      }
    );
  }

  // Обработчик изменения поисковой строки
  onChangeSearchTitle(e) {
    const searchValue = e.target.value;
    this.setState({
      searchTitle: searchValue
    }, () => {
      // Вызываем поиск после обновления состояния
      this.searchTitle();
    });
  }

  // Получение всех инцидентов
  retrieveIncidents() {
    IncidentService.getAll()
      .then(response => {
        this.setState({
          allIncidents: response.data,
          filteredIncidents: response.data
        });
      })
      .catch(e => {
        console.log(e);
      });
  }

  // Обновление списка
  refreshList() {
    this.retrieveIncidents();
    this.setState({
      currentIncident: null,
      currentIndex: -1
    });
  }

  // Установка активного инцидента
  setActiveIncident(incident, index) {
    this.setState({
      currentIncident: incident,
      currentIndex: index
    });
  }

  // Удаление всех инцидентов
  removeAllIncidents() {
    IncidentService.deleteAll()
      .then(response => {
        this.refreshList();
      })
      .catch(e => {
        console.log(e);
      });
  }

  // Поиск по названию
  searchTitle() {
    const { searchTitle, allIncidents } = this.state;
    
    if (!searchTitle.trim()) {
      // Если строка поиска пуста, показываем все инциденты
      this.setState({
        filteredIncidents: allIncidents
      });
      return;
    }

    // Фильтрация по названию (регистронезависимая)
    const filtered = allIncidents.filter(incident => 
      incident.title.toLowerCase().includes(searchTitle.toLowerCase())
    );
    
    this.setState({
      filteredIncidents: filtered
    });
  }

  render() {
    const { 
      searchTitle, 
      filteredIncidents, 
      currentIncident, 
      currentIndex, 
      content 
    } = this.state;

    return (
      <div className="container">
        <header className="jumbotron">
          <h3>{content}</h3>
        </header>
        
        <div className="list row">
          <div className="col-md-8">
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Поиск по названию"
                value={searchTitle}
                onChange={this.onChangeSearchTitle}
                onKeyPress={(e) => e.key === 'Enter' && this.searchTitle()}
              />
              <div className="input-group-append">
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={this.searchTitle}
                >
                  Поиск
                </button>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <h4>Список Инцидентов</h4>

            <ul className="list-group">
              {filteredIncidents.map((incident, index) => (
                <li
                  className={
                    "list-group-item " +
                    (index === currentIndex ? "active" : "")
                  }
                  onClick={() => this.setActiveIncident(incident, index)}
                  key={index}
                >
                  {incident.title}
                </li>
              ))}
            </ul>

            
          </div>
          
          <div className="col-md-6">
            {currentIncident ? (
              <div>
                <h4>Инцидент</h4>
                <div>
                  <label><strong>Название:</strong></label>{" "}
                  {currentIncident.title}
                </div>
                <div>
                  <label><strong>Описание:</strong></label>{" "}
                  {currentIncident.description}
                </div>
                <div>
                  <label><strong>Статус:</strong></label>{" "}
                  {currentIncident.published ? "Опубликован" : "Не опубликован"}
                </div>
                <div>
                  <label><strong>Тип:</strong></label>{" "}
                  {currentIncident.type || "Не указан"}
                </div>
                <div>
                  <label><strong>Дата:</strong></label>{" "}
                  {new Date(currentIncident.date).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <div>
                <br />
                <p>Для подробной информации нажмите на инцидент...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}