
/* /src/routes/privateRoute.jsx */
import React, { useState } from "react";
import { Route, Redirect } from "react-router-dom";
import { filter, switchMap, take } from 'rxjs/operators';

import { Auth } from "../services/AuthService";

export const PrivateRoute = ({ component, ...rest } : any) => {

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loaded, setLoaded] = useState(false);

    if(!loaded) {
        Auth.Instance.initComplete$
                    .pipe(filter(complete => complete),
                    switchMap(() => Auth.Instance.isAuthenticated$),
                    take(1))
                .subscribe((isAuthenticated) => {
                    setIsAuthenticated(isAuthenticated);
                    setLoaded(true);
                });
    }

    function renderFn(props: any) {
        if(loaded) {
            if (isAuthenticated) {
                return React.createElement(component, props);
            }
            return <Redirect to="/landing" />
        }
        return <p>Loading</p>
    }

    return <Route {...rest} render={renderFn} />;
};