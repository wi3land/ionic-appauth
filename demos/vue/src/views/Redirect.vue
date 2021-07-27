<template>
  <ion-page>
    <p>Signing in...</p>
  </ion-page>
</template>

<script lang="ts">
import { Auth } from '@/services/AuthService';
import { IonPage } from '@ionic/vue';
import {  AuthActions } from 'ionic-appauth';
import { Subscription } from 'rxjs';
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'Redirect',
    data() {
        return {
            sub: Subscription.EMPTY  
        }
    },
    created() {
        this.sub = Auth.Instance.events$.subscribe((action) => {
                if(action.action === AuthActions.SignInSuccess){
                    setInterval(() => this.$router.push('/home'), 2500)
                }
                
                if (action.action === AuthActions.SignInFailed) {
                    setInterval(() => this.$router.push('/landing'), 2500)
                }
        });

        const url = this.$route.fullPath;
        Auth.Instance.authorizationCallback(url);
    },
    beforeUnmount () {
        this.sub.unsubscribe();
    },
    components: {
        IonPage,
    }
});
</script>