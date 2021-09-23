import React, { useState } from 'react';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonPage, useIonViewWillEnter, useIonViewDidLeave } from '@ionic/react';

import { ActionCard } from '../components';
import { Auth } from '../services/AuthService';
import { AuthActions, AuthActionBuilder } from 'ionic-appauth';
import { RouteComponentProps } from 'react-router';
import { Subscription } from 'rxjs';

interface LandingPageProps extends RouteComponentProps {}

const Landing : React.FC<LandingPageProps> = (props: LandingPageProps) => {

    const [action, setAction] = useState(AuthActionBuilder.Init);
    
    let sub: Subscription;

    useIonViewWillEnter(() => {
        sub = Auth.Instance.events$.subscribe((action) => {
            setAction(action)
            if(action.action === AuthActions.SignInSuccess){
              props.history.replace('home');
            }
        });
    });

    useIonViewDidLeave(() => {
        sub.unsubscribe();
    });
 
    function handleSignIn(e : any) {
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
