import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonPage,
  useIonViewWillEnter,
  useIonViewDidLeave
} from '@ionic/react';

import { ActionCard } from '../components';
import { Auth } from '../services/AuthService';
import { AuthActions, AuthActionBuilder } from 'ionic-appauth';
import { RouteComponentProps } from 'react-router';
import { Subscription } from 'rxjs';

interface LandingPageProps extends RouteComponentProps {
}

const Landing: React.FC<LandingPageProps> = (props: LandingPageProps) => {

  const [action, setAction] = useState(AuthActionBuilder.Init);

  let sub: Subscription;

  useIonViewWillEnter(() => {
    sub = Auth.Instance.events$.subscribe((action) => {
      setAction(action)
      if (action.action === AuthActions.SignInSuccess) {
        // The pause below helps alleviate the following error in iOS:
        //   SecurityError: Attempt to use history.replaceState() more than 100 times per 30 seconds
        // However, it doesn't solve it completely as it happen if you log out and log in again.
        // Similar behavior happens in Android on subsequent logins.
        setInterval(() => props.history.replace('home'), 500)
      }
    });
  });

  useIonViewDidLeave(() => {
    sub.unsubscribe();
  });

  function handleSignIn(e: any) {
    e.preventDefault();
    Auth.Instance.signIn();
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Logged Out</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonButton onClick={handleSignIn}>Sign In</IonButton>
        <ActionCard action={action}></ActionCard>
      </IonContent>
    </IonPage>
  );
};

export default Landing;
