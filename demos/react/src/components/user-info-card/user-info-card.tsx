import React from 'react';
import { IonCard, IonCardHeader, IonCardContent } from '@ionic/react';

export const UserInfoCard = (props: any) => {
    return (
        <IonCard>
            <IonCardHeader>User Info</IonCardHeader>
            <IonCardContent>
                {JSON.stringify(props.user) }
            </IonCardContent>
        </IonCard>
    );
}
