import React from 'react';

import { Auth } from '../services/AuthService';
import { AuthActions } from 'ionic-appauth';
import { RouteComponentProps } from 'react-router';
import { useIonViewDidLeave, useIonViewDidEnter, IonPage } from '@ionic/react';
import { Subscription } from 'rxjs';

interface LoginRedirectPageProps extends RouteComponentProps {}

const LoginRedirect : React.FC<LoginRedirectPageProps> = (props: LoginRedirectPageProps) => {
    let sub: Subscription;
    
    useIonViewDidEnter(() => {
      let url = window.location.origin + props.location.pathname +  props.location.search;
      Auth.Instance.authorizationCallback(url);
      sub = Auth.Instance.events$.subscribe((action) => {
        if(action.action === AuthActions.SignInSuccess){
          setInterval(() => props.history.replace('home'), 2500)
        }
        
        if (action.action === AuthActions.SignInFailed) {
          setInterval(() => props.history.replace('landing'), 2500)
        }
      });
    });

    useIonViewDidLeave(() => {
      sub.unsubscribe();
    });

    return (
      <IonPage>
        <p>Signing in...</p>
      </IonPage>
    ); 
};

export default LoginRedirect;
