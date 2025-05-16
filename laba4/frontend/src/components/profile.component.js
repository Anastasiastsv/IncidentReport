import React, { Component } from "react";
import { Navigate } from "react-router-dom";
import AuthService from "../services/auth.service";

// Import avatar images from assets
import avatar1 from "../assets/avatar1.png";
import avatar2 from "../assets/avatar2.png";
import avatar3 from "../assets/avatar3.png";
import avatar4 from "../assets/avatar4.png";
import defaultAvatar from "../assets/default-avatar.png";

export default class Profile extends Component {
  constructor(props) {
    super(props);

    this.state = {
      redirect: null,
      userReady: false,
      currentUser: { username: "" },
      avatars: [
        { id: 1, src: avatar1 },
        { id: 2, src: avatar2 },
        { id: 3, src: avatar3 },
        { id: 4, src: avatar4 }
      ],
      selectedAvatar: null,
      showAvatarSelection: false
    };

    this.handleAvatarSelect = this.handleAvatarSelect.bind(this);
    this.toggleAvatarSelection = this.toggleAvatarSelection.bind(this);
  }

  componentDidMount() {
    const currentUser = AuthService.getCurrentUser();

    if (!currentUser) this.setState({ redirect: "/home" });
    this.setState({ 
      currentUser: currentUser, 
      userReady: true,
      selectedAvatar: currentUser.avatar || defaultAvatar
    });
  }

  handleAvatarSelect(avatar) {
    this.setState({
      selectedAvatar: avatar.src,
      showAvatarSelection: false
    });
    
  }

  toggleAvatarSelection() {
    this.setState(prevState => ({
      showAvatarSelection: !prevState.showAvatarSelection
    }));
  }

  render() {
    if (this.state.redirect) {
      return <Navigate to={this.state.redirect} />
    }

    const { currentUser, avatars, selectedAvatar, showAvatarSelection } = this.state;

    return (
      <div className="container">
        {(this.state.userReady) ?
        <div>
          <header className="jumbotron">
            <h3>
              <strong>{currentUser.username}</strong> Profile
            </h3>
          </header>
          
          <div className="avatar-section mb-4">
            <div 
              className="avatar-container" 
              onClick={this.toggleAvatarSelection}
              style={{ cursor: 'pointer', width: '150px', margin: '0 auto' }}
            >
              <img 
                src={selectedAvatar} 
                alt="User Avatar" 
                className="img-thumbnail rounded-circle"
                style={{ width: '150px', height: '150px' }}
              />
              <div className="text-center mt-2">
                <small>Click to change avatar</small>
              </div>
            </div>
            
            {showAvatarSelection && (
              <div className="avatar-selection-container mt-3 p-3 border rounded">
                <h5>Select an Avatar</h5>
                <div className="d-flex flex-wrap justify-content-center">
                  {avatars.map(avatar => (
                    <img
                      key={avatar.id}
                      src={avatar.src}
                      alt={`Avatar ${avatar.id}`}
                      className="img-thumbnail m-2 rounded-circle"
                      style={{ width: '80px', height: '80px', cursor: 'pointer' }}
                      onClick={() => this.handleAvatarSelect(avatar)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <p>
            <strong>Token:</strong>{" "}
            {currentUser.accessToken.substring(0, 20)} ...{" "}
            {currentUser.accessToken.substr(currentUser.accessToken.length - 20)}
          </p>
          <p>
            <strong>Id:</strong>{" "}
            {currentUser.id}
          </p>
          <p>
            <strong>Email:</strong>{" "}
            {currentUser.email}
          </p>
          <strong>Authorities:</strong>
          <ul>
            {currentUser.roles &&
              currentUser.roles.map((role, index) => <li key={index}>{role}</li>)}
          </ul>
        </div>: null}
      </div>
    );
  }
}