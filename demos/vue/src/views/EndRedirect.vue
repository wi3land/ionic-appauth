<template>
  <ion-page>
    <p>Signing Out...</p>
  </ion-page>
</template>

<script lang="ts">
import { Auth } from '@/services/AuthService';
import { IonPage } from '@ionic/vue';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'EndRedirect',
  created() {
    Auth.Instance.endSessionCallback();
    setInterval(() => this.$router.push('/landing'), 2500);
  },
  components: {
    IonPage,
  }
});
</script>
