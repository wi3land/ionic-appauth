import React from 'react';
import { IonCard, IonCardHeader, IonCardContent } from '@ionic/react';

export const ActionCard = (props : any) => {

    return (
        <IonCard>
            <IonCardHeader>Action Data</IonCardHeader>
            <IonCardContent>
                {JSON.stringify(props.action) }
            </IonCardContent>
        </IonCard>
    );
}