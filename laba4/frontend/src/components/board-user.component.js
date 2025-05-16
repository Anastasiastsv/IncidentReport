import React, { Component } from "react";
import UserService from "../services/user.service";

import { 
  Card, 
  ListGroup, 
  Alert, 
  Carousel, 
  Image, 
  Button, 
  ProgressBar,
  Badge,
  Accordion
} from "react-bootstrap";
import securityTips from "../assets/security-tips.jpg";
import phishing from "../assets/phishing.jpg";
import updates from "../assets/updates.jpg";
import backup from "../assets/backup.jpg";
import vpn from "../assets/vpn.jpg";
import "./BoardUser.css";

export default class BoardUser extends Component {
  constructor(props) {
    super(props);

    this.state = {
      content: "",
      dbConnected: true,
      tips: [
        {
          text: "Используйте сложные пароли (12+ символов) и менеджер паролей",
          image: securityTips,
          details: "Хороший пароль должен содержать буквы в разных регистрах, цифры и специальные символы. Менеджеры паролей помогают создавать и хранить сложные пароли."
        },
        {
          text: "Включите двухфакторную аутентификацию везде, где возможно",
          image: phishing,
          details: "2FA добавляет дополнительный уровень защиты. Даже если злоумышленник узнает ваш пароль, без второго фактора он не сможет войти в аккаунт."
        },
        {
          text: "Регулярно обновляйте программное обеспечение",
          image: updates,
          details: "Обновления часто содержат исправления уязвимостей. Включите автоматические обновления для операционной системы и критических приложений."
        },
        {
          text: "Не открывайте подозрительные вложения в письмах",
          image: phishing,
          details: "Фишинговые письма часто маскируются под важные уведомления. Проверяйте отправителя и не открывайте вложения, если не уверены в их безопасности."
        },
        {
          text: "Проверяйте URL сайтов перед вводом учетных данных",
          image: securityTips,
          details: "Мошенники создают поддельные сайты, похожие на настоящие. Всегда проверяйте адресную строку перед вводом логина и пароля."
        },
        {
          text: "Используйте VPN в общественных сетях Wi-Fi",
          image: vpn,
          details: "Публичные Wi-Fi сети часто не защищены. VPN шифрует ваш трафик, защищая данные от перехвата злоумышленниками."
        },
        {
          text: "Регулярно делайте резервные копии важных данных",
          image: backup,
          details: "Используйте правило 3-2-1: 3 копии данных, на 2 разных носителях, 1 из которых в другом физическом местоположении."
        }
      ],
      currentTip: 0,
      fade: true,
      showDetails: false,
      securityChecklist: [
        { id: 1, text: "Изменил пароль за последние 3 месяца", completed: false },
        { id: 2, text: "Включил двухфакторную аутентификацию", completed: false },
        { id: 3, text: "Установил все обновления ОС", completed: false },
        { id: 4, text: "Проверил настройки конфиденциальности", completed: false },
        { id: 5, text: "Сделал резервную копию важных файлов", completed: false }
      ],
      activeCarouselIndex: 0
    };
  }

  componentDidMount() {
    UserService.getUserBoard().then(
      response => {
        this.setState({
          content: response.data,
          dbConnected:true
        });
      },
      error => {
        this.setState({
          content:
            (error.response &&
              error.response.data &&
              error.response.data.message) ||
            error.message ||
            error.toString(),
          dbConnected: false
        });
      }
    );

    this.tipInterval = setInterval(() => {
      this.setState({ fade: false }, () => {
        setTimeout(() => {
          this.setState(prevState => ({
            currentTip: (prevState.currentTip + 1) % prevState.tips.length,
            fade: true,
            showDetails: false
          }));
        }, 300);
      });
    }, 8000);
  }

  componentWillUnmount() {
    clearInterval(this.tipInterval);
  }

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  toggleChecklistItem = (id) => {
    this.setState(prevState => ({
      securityChecklist: prevState.securityChecklist.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    }));
  };

  handleCarouselSelect = (selectedIndex) => {
    this.setState({ activeCarouselIndex: selectedIndex });
  };

  render() {
    const { 
      content, 
      tips, 
      currentTip, 
      fade, 
      showDetails,
      securityChecklist,
      activeCarouselIndex,
      dbConnected
    } = this.state;

    const completedCount = securityChecklist.filter(item => item.completed).length;
    const completionPercentage = (completedCount / securityChecklist.length) * 100;
    // Проверка состояния подключения
    if (!dbConnected) {
      return (
        <div className="container text-center">
          <h3>No token provided</h3>
        </div>
      );
    }

    return (
      <div className="board-user-container">
        <header className="jumbotron animated-header">
          <h3>{content}</h3>
          <p className="lead">Ваш персональный центр информационной безопасности</p>
        </header>

        <div className="row">
          <div className="col-md-8">
            <Card className="mb-4 security-tip-card">
              <Card.Header as="h5" className="d-flex align-items-center">
                <i className="fas fa-shield-alt mr-2"></i>
                Совет дня по безопасности
                <Badge pill variant="info" className="ml-2">Новый!</Badge>
              </Card.Header>
              <Card.Body className="d-flex flex-column flex-md-row align-items-center">
                <Image 
                  src={tips[currentTip].image} 
                  rounded 
                  className="security-tip-image mr-md-4 mb-3 mb-md-0"
                />
                <div className="flex-grow-1">
                  <Card.Text className={`security-tip-text ${fade ? 'fade-in' : 'fade-out'}`}>
                    {tips[currentTip].text}
                  </Card.Text>
                  <Button 
                    variant="outline-info" 
                    size="sm" 
                    onClick={this.toggleDetails}
                    className="mt-2"
                  >
                    {showDetails ? 'Скрыть детали' : 'Подробнее...'}
                  </Button>
                  {showDetails && (
                    <div className="security-tip-details mt-3">
                      <p>{tips[currentTip].details}</p>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <small className="text-muted">
                          Совет {currentTip + 1} из {tips.length}
                        </small>
                        <Button 
                          variant="link" 
                          size="sm"
                          onClick={() => {
                            this.setState({ fade: false }, () => {
                              setTimeout(() => {
                                this.setState(prevState => ({
                                  currentTip: (prevState.currentTip + 1) % prevState.tips.length,
                                  fade: true,
                                  showDetails: false
                                }));
                              }, 300);
                            });
                          }}
                        >
                          Следующий совет <i className="fas fa-arrow-right ml-1"></i>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>

            <Card className="mb-4">
              <Card.Header as="h5" className="d-flex align-items-center">
                <i className="fas fa-lock mr-2"></i>
                Основные меры защиты
                <Badge variant="secondary" className="ml-auto">
                  {activeCarouselIndex + 1}/{4}
                </Badge>
              </Card.Header>
              <Card.Body>
                <Carousel 
                  indicators={false} 
                  interval={null}
                  activeIndex={activeCarouselIndex}
                  onSelect={this.handleCarouselSelect}
                >
                  <Carousel.Item>
                    <div className="d-flex flex-column flex-md-row">
                      <Image src={securityTips} rounded className="carousel-image mr-md-4 mb-3 mb-md-0"/>
                      <div>
                        <h5>Защита учетных записей</h5>
                        <p>
                          Никому не сообщайте свои пароли, даже администраторам системы. 
                          Настоящие администраторы никогда не спросят ваш пароль.
                        </p>
                        <ul className="security-list">
                          <li>Используйте уникальные пароли для каждого сервиса</li>
                          <li>Меняйте пароли не реже чем раз в 3 месяца</li>
                          <li>Используйте биометрическую аутентификацию, если возможно</li>
                        </ul>
                      </div>
                    </div>
                  </Carousel.Item>
                  <Carousel.Item>
                    <div className="d-flex flex-column flex-md-row">
                      <Image src={phishing} rounded className="carousel-image mr-md-4 mb-3 mb-md-0"/>
                      <div>
                        <h5>Фишинг и социальная инженерия</h5>
                        <p>
                          Будьте осторожны с письмами, требующими срочных действий. 
                          Всегда проверяйте адрес отправителя и не переходите по подозрительным ссылкам.
                        </p>
                        <ul className="security-list">
                          <li>Проверяйте орфографию в письмах - ошибки часто выдают подделку</li>
                          <li>Не отвечайте на письма с просьбой предоставить личные данные</li>
                          <li>При сомнениях свяжитесь с организацией по официальным каналам</li>
                        </ul>
                      </div>
                    </div>
                  </Carousel.Item>
                  <Carousel.Item>
                    <div className="d-flex flex-column flex-md-row">
                      <Image src={updates} rounded className="carousel-image mr-md-4 mb-3 mb-md-0"/>
                      <div>
                        <h5>Обновления и патчи</h5>
                        <p>
                          Своевременно устанавливайте обновления безопасности 
                          для операционной системы и всех приложений.
                        </p>
                        <ul className="security-list">
                          <li>Включите автоматические обновления для ОС</li>
                          <li>Регулярно обновляйте браузеры и плагины</li>
                          <li>Не откладывайте установку критических обновлений</li>
                        </ul>
                      </div>
                    </div>
                  </Carousel.Item>
                  <Carousel.Item>
                    <div className="d-flex flex-column flex-md-row">
                      <Image src={backup} rounded className="carousel-image mr-md-4 mb-3 mb-md-0"/>
                      <div>
                        <h5>Резервные копии и восстановление</h5>
                        <p>
                          Регулярно сохраняйте важные данные на внешние носители 
                          или в облачное хранилище с надежной защитой.
                        </p>
                        <ul className="security-list">
                          <li>Проверяйте, что резервные копии действительно работают</li>
                          <li>Храните копии в разных физических местах</li>
                          <li>Шифруйте резервные копии с конфиденциальными данными</li>
                        </ul>
                      </div>
                    </div>
                  </Carousel.Item>
                </Carousel>
                <div className="d-flex justify-content-center mt-3">
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={() => this.handleCarouselSelect((activeCarouselIndex - 1 + 4) % 4)}
                    className="mr-2"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={() => this.handleCarouselSelect((activeCarouselIndex + 1) % 4)}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>

          <div className="col-md-4">
            <Card className="mb-4">
              <Card.Header as="h5" className="d-flex align-items-center">
                <i className="fas fa-clipboard-check mr-2"></i>
                Ваш чек-лист безопасности
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <small>Прогресс защиты</small>
                    <small>{Math.round(completionPercentage)}%</small>
                  </div>
                  <ProgressBar 
                    now={completionPercentage} 
                    variant={completionPercentage < 50 ? "danger" : completionPercentage < 80 ? "warning" : "success"}
                    animated 
                  />
                </div>
                <ListGroup variant="flush">
                  {securityChecklist.map(item => (
                    <ListGroup.Item 
                      key={item.id} 
                      className="d-flex align-items-center checklist-item"
                      action
                      onClick={() => this.toggleChecklistItem(item.id)}
                    >
                      <div className={`custom-checkbox mr-3 ${item.completed ? 'checked' : ''}`}>
                        {item.completed && <i className="fas fa-check"></i>}
                      </div>
                      <span className={item.completed ? 'completed' : ''}>
                        {item.text}
                      </span>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
                
              </Card.Body>
            </Card>

            <Card className="mb-4">
              <Card.Header as="h5" className="d-flex align-items-center">
                <i className="fas fa-question-circle mr-2"></i>
                Частые вопросы
              </Card.Header>
              <Card.Body>
                <Accordion defaultActiveKey="0">
                  <Accordion.Item eventKey="0" className="mb-2">
                    <Accordion.Header>Как создать надежный пароль?</Accordion.Header>
                    <Accordion.Body>
                      Используйте длинные фразы (например, "КосмическиеКотыЛюбят2023!"). 
                      Избегайте личной информации. 
                      Меняйте пароли раз в 3 месяца.
                    </Accordion.Body>
                  </Accordion.Item>
                  <Accordion.Item eventKey="1" className="mb-2">
                    <Accordion.Header>Как распознать фишинговое письмо?</Accordion.Header>
                    <Accordion.Body>
                      Обращайте внимание на: 
                      1) Ошибки в написании, 
                      2) Общий адрес ("Уважаемый клиент"), 
                      3) Срочность ("Ваш аккаунт будет заблокирован!"), 
                      4) Подозрительные ссылки.
                    </Accordion.Body>
                  </Accordion.Item>
                  <Accordion.Item eventKey="2">
                    <Accordion.Header>Какой VPN лучше использовать?</Accordion.Header>
                    <Accordion.Body>
                      Выбирайте проверенные сервисы с прозрачной политикой конфиденциальности. 
                      В корпоративной среде используйте только одобренные IT-отделом решения.
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </Card.Body>
            </Card>
          </div>
        </div>

        <Alert variant="info" className="mt-4 security-alert">
          <Alert.Heading>
            <i className="fas fa-exclamation-triangle mr-2"></i>
            Важно! Сообщайте о подозрительных активностях
          </Alert.Heading>
          <p>
            При возникновении любых подозрительных ситуаций (необычные запросы, 
            странное поведение системы) немедленно сообщите в отдел информационной безопасности.
          </p>
          <ul className="mb-3">
            <li>Получили подозрительное письмо? Не переходите по ссылкам!</li>
            <li>Заметили необычную активность в аккаунте? Смените пароль!</li>
            <li>Установили подозрительную программу? Отключите интернет!</li>
          </ul>
          <hr />
          <div className="d-flex flex-wrap justify-content-between align-items-center">
            <div>
              <p className="mb-1">
                <i className="fas fa-envelope mr-2"></i>
                security@yourcompany.com
              </p>
              <p className="mb-1">
                <i className="fas fa-phone mr-2"></i>
                Внутренний телефон: 5555 (круглосуточно)
              </p>
            </div>
            
          </div>
        </Alert>

        <div className="security-stats mt-4 p-4">
          <h5 className="text-center mb-4">
            <i className="fas fa-chart-bar mr-2"></i>
            Статистика безопасности компании
          </h5>
          <div className="row">
            <div className="col-md-3 col-6 mb-3">
              <div className="stat-item">
                <div className="stat-value">95%</div>
                <div className="stat-label">Успешных обновлений</div>
                <ProgressBar now={95} variant="success" className="mt-2" />
              </div>
            </div>
            <div className="col-md-3 col-6 mb-3">
              <div className="stat-item">
                <div className="stat-value">78%</div>
                <div className="stat-label">Используют 2FA</div>
                <ProgressBar now={78} variant="info" className="mt-2" />
              </div>
            </div>
            <div className="col-md-3 col-6 mb-3">
              <div className="stat-item">
                <div className="stat-value">62%</div>
                <div className="stat-label">Регулярные бэкапы</div>
                <ProgressBar now={62} variant="warning" className="mt-2" />
              </div>
            </div>
            <div className="col-md-3 col-6 mb-3">
              <div className="stat-item">
                <div className="stat-value">14</div>
                <div className="stat-label">Дней без инцидентов</div>
                <div className="days-counter mt-2">14</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }
}