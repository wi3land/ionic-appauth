<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Logged In</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-button @click="handleGetUserDetails()">Get User Details</ion-button>
      <ion-button @click="handleRefresh()">Refresh Token</ion-button>
      <ion-button @click="handleSignOut()">Sign Out</ion-button>

      <ion-card v-if="event !== ''">
        <ion-card-header>
          Action Data
        </ion-card-header>
        <ion-card-content>
          {{event}}
        </ion-card-content>
      </ion-card>

      <ion-card v-if="user !== ''">
        <ion-card-header>
          User Info
        </ion-card-header>
        <ion-card-content>
          {{user}}
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonButton } from '@ionic/vue';
import { defineComponent } from 'vue';
import { Auth } from '@/services/AuthService';
import { AuthActions } from 'ionic-appauth';
import { Subscription } from 'rxjs';

export default defineComponent({
  name: 'Home',
  data() {
    return {
        event: '',
        user: '',
        subs: [] as Subscription[]
    };
  },
  created () {
    this.subs.push(
            Auth.Instance.events$.subscribe((action) => {
                this.event = JSON.stringify(action);
                if (action.action === AuthActions.SignOutSuccess) {
                    this.$router.push('/landing');
                }
            }),
            Auth.Instance.user$.subscribe((user) => {
                this.user = JSON.stringify(user);
            })
    );
  },
  beforeUnmount () {
      this.subs.forEach(sub => sub.unsubscribe());
  },
  methods: {
    handleSignOut() {
        Auth.Instance.signOut();
    },
    handleRefresh() {
        Auth.Instance.refreshToken();
    },
    handleGetUserDetails() {
        Auth.Instance.loadUserInfo();
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