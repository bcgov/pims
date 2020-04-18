import React from 'react';
import { Route, RouteProps } from 'react-router-dom';
import PrivateRoute from 'utils/PrivateRoute';

export type IAppRouteProps = RouteProps & {
  component: React.ComponentType<any>;
  layout?: React.ComponentType<any>;
  protected?: boolean;
  role?: string | string[];
  claim?: string | string[];
};

const AppRoute: React.FC<IAppRouteProps> = ({
  component: Component,
  layout,
  protected: usePrivateRoute,
  role,
  claim,
  ...rest
}) => {
  const Layout = layout === undefined ? (props: any) => <>{props.children}</> : layout;

  if (!!usePrivateRoute) {
    return <PrivateRoute {...rest} component={Component} role={role} claim={claim} />;
  }

  return (
    <Route
      {...rest}
      render={props => (
        <Layout>
          <Component {...props} />
        </Layout>
      )}
    />
  );
};

export default AppRoute;
