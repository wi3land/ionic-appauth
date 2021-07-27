import React, { useState } from 'react';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonPage, useIonViewWillEnter, useIonViewDidLeave } from '@ionic/react';

import { ActionCard, UserInfoCard } from '../components';
import { Auth } from '../services/AuthService';
import { AuthActions, AuthActionBuilder } from 'ionic-appauth';
import { RouteComponentProps } from 'react-router';
import { Subscription } from 'rxjs';

interface HomePageProps extends RouteComponentProps {}

const Home : React.FC<HomePageProps> = (props: HomePageProps) => {

    const [action, setAction] = useState(AuthActionBuilder.Init);
    const [user, setUser] = useState();
    let subs: Subscription[] = [];

    useIonViewWillEnter(() => {
        subs.push(
            Auth.Instance.events$.subscribe((action) => {
                setAction(action);
                if (action.action === AuthActions.SignOutSuccess) {
                    props.history.replace('landing');
                }
            }),
            Auth.Instance.user$.subscribe((user) => {
                setUser(user)
            })
        )
    });

    useIonViewDidLeave(() => {
        subs.forEach(sub => sub.unsubscribe());
    });
    
    function handleSignOut(e : any) {
        e.preventDefault();
        Auth.Instance.signOut();
    }

    function handleRefresh(e : any) {
        e.preventDefault();
        Auth.Instance.refreshToken();
    }

    function handleGetUserDetails(e : any) {
        e.preventDefault();
        Auth.Instance.loadUserInfo();
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Logged In</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonButton onClick={handleGetUserDetails}>Get User Details</IonButton>
                <IonButton onClick={handleRefresh}>Refresh Token</IonButton>
                <IonButton onClick={handleSignOut}>Sign Out</IonButton>
                <ActionCard action={action}></ActionCard>
                {user && <UserInfoCard user={user}></UserInfoCard>}       
            </IonContent>
        </IonPage>
    ); 
};

export default Home;
