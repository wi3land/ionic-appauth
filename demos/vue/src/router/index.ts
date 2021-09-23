import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Home from '../views/Home.vue'
import Landing from '../views/Landing.vue'
import Redirect from '../views/Redirect.vue'
import EndRedirect from '../views/EndRedirect.vue'
import { Auth } from '@/services/AuthService';
import { filter, switchMap, take } from 'rxjs/operators';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: Home
  },
  {
    path: '/landing',
    name: 'Landing',
    component: Landing
  },
  {
    path: '/authcallback',
    name: 'Redirect',
    component: Redirect
  },
  {
    path: '/endsession',
    name: 'EndRedirect',
    component: EndRedirect
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})


router.beforeEach((to, from, next) => {
  if (to.name === 'Home') {
    Auth.Instance.initComplete$.pipe(
      filter(complete => complete),
      switchMap(() => Auth.Instance.isAuthenticated$),
        take(1))
        .subscribe((isAuthenticated) => {
            if(isAuthenticated) {
              next();
            }else{
              next({ path: '/landing' })
            }
        });
  }else{
    next();
  }
})

export default router
