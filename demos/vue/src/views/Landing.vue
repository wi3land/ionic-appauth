<template>
  <ion-page>
    <ion-header>
        <ion-toolbar>
            <ion-title>Logged Out</ion-title>
        </ion-toolbar>
        </ion-header>

        <ion-content>
            <ion-button @click="signIn()">Sign In</ion-button>
            <ion-card v-if="event !== ''">
                <ion-card-header>
                    Action Data
                </ion-card-header>
                <ion-card-content>
                    {{event}}
                </ion-card-content>
            </ion-card>
        </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { Auth } from '@/services/AuthService';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonButton } from '@ionic/vue';
import {  AuthActions } from 'ionic-appauth';
import { Subscription } from 'rxjs';
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'Landing',
    data () {
        return {
            event: '',
            // sub: Subscription.EMPTY
        };
    },
    created () {
        Auth.Instance.events$.subscribe((action) => {
            this.event = JSON.stringify(action);
            if(action.action === AuthActions.SignInSuccess){
                    this.$router.push('/home');
            }
        });
    },
    // beforeUnmount () {
    //     this.sub.unsubscribe();
    // },
    methods: {
        signIn() {
            Auth.Instance.signIn();
        }
    },
    components: {
        IonContent,
        IonHeader,
        IonPage,
        IonTitle,
        IonToolbar,
        IonCard, 
        IonCardContent, 
        IonCardHeader, 
        IonButton
    }
});
</script>