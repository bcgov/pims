import React, { Component } from 'react';
import { Container, Row } from 'react-bootstrap';
import './App.scss';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import MapView from './pages/MapView';
import PrivateRoute from './PrivateRoute';
import Login from './pages/Login';
import Header from './components/navigation/Header';
import Footer from './components/navigation/Footer';
import { withKeycloak, ReactKeycloakInjectedProps } from '@react-keycloak/web';
import { KeycloakInstance } from 'keycloak-js';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';


//import Debug from './components/Debug/Debug';

interface IState {
  keycloak?: KeycloakInstance<"native">,
  keycloakInitialized: boolean
}

class App extends Component<ReactKeycloakInjectedProps, IState> {

  constructor(props: ReactKeycloakInjectedProps) {
    super(props);
    this.state = { keycloak: props.keycloak, keycloakInitialized: this.props.keycloakInitialized };
  }

  render() {
    return (
      <Router>
        <Container className="App" fluid={true}>
          <Header></Header>
          <Row className="App-content">
            <Route path="/" component={Login}></Route>
            <PrivateRoute
              path="/mapview"
              component={MapView}
            />
          </Row>
          <Footer></Footer>
        </Container>
      </Router>
    );
  }
}

export default withKeycloak(App);
