import React from 'react';

import { Auth } from '../services/AuthService';
import { RouteComponentProps } from 'react-router';
import { useIonViewWillEnter, IonPage } from '@ionic/react';

interface EndRedirectPageProps extends RouteComponentProps {}

const EndRedirect : React.FC<EndRedirectPageProps> = (props: EndRedirectPageProps) => {

    useIonViewWillEnter(() => {
        Auth.Instance.endSessionCallback();
    });
    
    return (
        <IonPage>
            <p>Signing out...</p>
        </IonPage>
        
    ); 
};

export default EndRedirect;
