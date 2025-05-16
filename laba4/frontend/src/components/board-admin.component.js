import React, { Component } from "react";
import IncidentService from "../services/incident.service";
import UserService from "../services/user.service";
import EventBus from "../common/EventBus";

export default class BoardAdmin extends Component {
  constructor(props) {
    super(props);

    this.state = {
      content: "",
      incidents: [],
      currentIncident: null,
      currentIndex: -1,
      searchTitle: "",
      editMode: false,
      editedIncident: {
        title: "",
        description: "",
        type: "",
        published: false,
        date: ""
      }
    };

    this.onChangeSearchTitle = this.onChangeSearchTitle.bind(this);
    this.retrieveIncidents = this.retrieveIncidents.bind(this);
    this.refreshList = this.refreshList.bind(this);
    this.setActiveIncident = this.setActiveIncident.bind(this);
    this.searchTitle = this.searchTitle.bind(this);
    this.deleteIncident = this.deleteIncident.bind(this);
    this.togglePublishStatus = this.togglePublishStatus.bind(this);
    this.toggleEditMode = this.toggleEditMode.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
    this.saveChanges = this.saveChanges.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
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

  retrieveIncidents() {
    IncidentService.getAllAdmin()
      .then(response => {
        this.setState({
          incidents: response.data
        });
      })
      .catch(e => {
        console.log(e);
      });
  }

  refreshList() {
    this.retrieveIncidents();
    this.setState({
      currentIncident: null,
      currentIndex: -1,
      editMode: false
    });
  }

  onChangeSearchTitle(e) {
    const searchTitle = e.target.value;
    this.setState({
      searchTitle: searchTitle
    });
  }

  searchTitle() {
    IncidentService.findByTitle(this.state.searchTitle)
      .then(response => {
        this.setState({
          incidents: response.data
        });
      })
      .catch(e => {
        console.log(e);
      });
  }

  setActiveIncident(incident, index) {
    this.setState({
      currentIncident: incident,
      currentIndex: index,
      editMode: false,
      editedIncident: { ...incident }
    });
  }

  toggleEditMode() {
    this.setState(prevState => ({
      editMode: !prevState.editMode,
      editedIncident: { ...prevState.currentIncident }
    }));
  }

  handleInputChange(e) {
    const { name, value } = e.target;
    this.setState(prevState => ({
      editedIncident: {
        ...prevState.editedIncident,
        [name]: value
      }
    }));
  }

  handleCheckboxChange(e) {
    const { name, checked } = e.target;
    this.setState(prevState => ({
      editedIncident: {
        ...prevState.editedIncident,
        [name]: checked
      }
    }));
  }

  saveChanges() {
    const { editedIncident } = this.state;
    IncidentService.update(editedIncident.id, editedIncident)
      .then(response => {
        this.setState({
          currentIncident: response.data,
          editMode: false
        });
        this.retrieveIncidents();
      })
      .catch(e => {
        console.log(e);
      });
  }

  cancelEdit() {
    this.setState({
      editMode: false
    });
  }

  deleteIncident(id) {
    if (window.confirm("Вы уверены, что хотите удалить этот инцидент?")) {
      IncidentService.delete(id)
        .then(response => {
          this.refreshList();
        })
        .catch(e => {
          console.log(e);
        });
    }
  }

  togglePublishStatus(id, currentStatus) {
    const newStatus = !currentStatus;
    IncidentService.update(id, { published: newStatus })
      .then(response => {
        this.refreshList();
      })
      .catch(e => {
        console.log(e);
      });
  }

  render() {
    const { 
      content, 
      incidents, 
      currentIncident, 
      currentIndex, 
      searchTitle,
      editMode,
      editedIncident
    } = this.state;

    return (
      <div className="container">
        <header className="jumbotron">
          <h3>{content}</h3>
        </header>

        

        <div className="row">
          <div className="col-md-6">
            <h4>Список инцидентов</h4>
            <ul className="list-group">
              {incidents &&
                incidents.map((incident, index) => (
                  <li
                    className={
                      "list-group-item " +
                      (index === currentIndex ? "active" : "") +
                      (incident.published ? " list-group-item-success" : "")
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
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h4 className="mb-0">
                    {editMode ? "Редактирование инцидента" : "Детали инцидента"}
                  </h4>
                  {!editMode && (
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={this.toggleEditMode}
                    >
                      Редактировать
                    </button>
                  )}
                </div>
                
                <div className="card-body">
                  {editMode ? (
                    <form>
                      <div className="form-group mb-3">
                        <label>Название:</label>
                        <input
                          type="text"
                          className="form-control"
                          name="title"
                          value={editedIncident.title}
                          onChange={this.handleInputChange}
                        />
                      </div>
                      
                      <div className="form-group mb-3">
                        <label>Описание:</label>
                        <textarea
                          className="form-control"
                          name="description"
                          rows="3"
                          value={editedIncident.description}
                          onChange={this.handleInputChange}
                        />
                      </div>
                      
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Тип:</label>
                            <select
                              className="form-control"
                              name="type"
                              value={editedIncident.type || ""}
                              onChange={this.handleInputChange}
                            >
                              <option value="">Выберите тип</option>
                              <option value="Технический">Технический</option>
                              <option value="Безопасность">Безопасность</option>
                              <option value="Персонал">Персонал</option>
                              <option value="Другое">Другое</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Дата:</label>
                            <input
                              type="date"
                              className="form-control"
                              name="date"
                              value={editedIncident.date.split('T')[0]}
                              onChange={this.handleInputChange}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="form-check mb-3">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          name="published"
                          checked={editedIncident.published}
                          onChange={this.handleCheckboxChange}
                          id="publishedCheck"
                        />
                        <label className="form-check-label" htmlFor="publishedCheck">
                          Опубликовано
                        </label>
                      </div>
                      
                      <div className="d-flex justify-content-end">
                        <button
                          type="button"
                          className="btn btn-outline-secondary me-2"
                          onClick={this.cancelEdit}
                        >
                          Отмена
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={this.saveChanges}
                        >
                          Сохранить
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <div className="mb-3">
                        <label><strong>Название:</strong></label>
                        <p>{currentIncident.title}</p>
                      </div>
                      
                      <div className="mb-3">
                        <label><strong>Описание:</strong></label>
                        <p>{currentIncident.description}</p>
                      </div>
                      
                      <div className="mb-3">
                        <label><strong>Статус:</strong></label>
                        <span className={`badge ${currentIncident.published ? 'bg-success' : 'bg-warning'}`}>
                          {currentIncident.published ? 'Опубликован' : 'Не опубликован'}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <label><strong>Тип:</strong></label>
                        <p>{currentIncident.type || "Не указан"}</p>
                      </div>
                      
                      <div className="mb-3">
                        <label><strong>Дата:</strong></label>
                        <p>{new Date(currentIncident.date).toLocaleDateString()}</p>
                      </div>
                      
                      <div className="mt-3">
                        <button
                          className="btn btn-primary me-2"
                          onClick={() => this.togglePublishStatus(currentIncident.id, currentIncident.published)}
                        >
                          {currentIncident.published ? 'Снять с публикации' : 'Опубликовать'}
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => this.deleteIncident(currentIncident.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-body">
                  <p className="text-muted">Выберите инцидент для просмотра деталей...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}