import FilterBackdrop from 'components/maps/leaflet/FilterBackdrop';
import { Claims } from 'constants/claims';
import { IENotSupportedPage } from 'features/account/IENotSupportedPage';
import Login from 'features/account/Login';
import { LogoutPage } from 'features/account/Logout';
import { LayoutWrapper, SelectProjectPropertiesPage } from 'features/projects/common';
import { ProjectLayout } from 'features/projects/disposals';
import {
  ProjectCloseOut,
  ProjectDocumentation,
  ProjectERPTabs,
  ProjectInformationTabs,
  ProjectNotifications,
  ProjectNotSPL,
  ProjectSPLTabs,
} from 'features/projects/disposals';
import {
  ProjectERPApproval,
  ProjectERPComplete,
  ProjectERPDisposed,
  ProjectERPExemption,
} from 'features/projects/disposals/erp';
import { ProjectInformation, ProjectProperties } from 'features/projects/disposals/information';
import {
  ProjectSPLApproval,
  ProjectSPLContractInPlace,
  ProjectSPLMarketing,
  ProjectSPLTransferWithinGRE,
} from 'features/projects/disposals/spl';
import { ProjectSummary } from 'features/projects/summary';
import MapView from 'features/properties/map/MapView';
import useKeycloakWrapper from 'hooks/useKeycloakWrapper';
import AuthLayout from 'layouts/AuthLayout';
import PublicLayout from 'layouts/PublicLayout';
import AccessDenied from 'pages/401/AccessDenied';
import { NotFoundPage } from 'pages/404/NotFoundPage';
import Test from 'pages/Test.ignore';
import React, { lazy, Suspense, useLayoutEffect } from 'react';
import { Col } from 'react-bootstrap';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { ReviewApproveStep } from '../projects/assess';
import { IsAuthenticatedRoute } from './IsAuthenticatedRoute';
import PrivateRoute from './PrivateRoute';

const AccessRequestPage = lazy(() => import('features/admin/access-request/AccessRequestPage'));
const EditUserPage = lazy(() => import('features/admin/edit-user/EditUserPage'));
const ManageAccessRequests = lazy(() => import('features/admin/access/ManageAccessRequests'));
const ProjectListView = lazy(() => import('features/projects/list/ProjectListView'));
const ProjectApprovalRequestListView = lazy(() =>
  import('features/projects/list/ProjectApprovalRequestListView'),
);
const ProjectRouter = lazy(() => import('features/projects/common/ProjectRouter'));
const SPLProjectListView = lazy(() => import('features/projects/list/SPLProjectListView'));
const ProjectDisposeView = lazy(() => import('features/projects/dispose/ProjectDisposeView'));
const SplReportContainer = lazy(() => import('features/splReports/containers/SplReportContainer'));
const ManageAgencies = lazy(() => import('features/admin/agencies/ManageAgencies'));
const EditAgencyPage = lazy(() => import('features/admin/agencies/EditAgencyPage'));
const ManageAdminAreas = lazy(() => import('features/admin/admin-areas/ManageAdminAreas'));
const ManageUsers = lazy(() => import('features/admin/users/ManageUsers'));
const EditAdminArea = lazy(() => import('features/admin/admin-areas/EditAdminArea'));
const PropertyListView = lazy(() => import('features/properties/list/PropertyListView'));

export const AppRouter: React.FC = () => {
  const location = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const getTitle = (page: string) => {
    return `PIMS${' - ' + page}`;
  };
  const keycloak = useKeycloakWrapper();
  return (
    <Suspense
      fallback={
        keycloak.obj.authenticated ? (
          <AuthLayout>
            <FilterBackdrop show={true}></FilterBackdrop>
          </AuthLayout>
        ) : (
          <PublicLayout>
            <Col>
              <FilterBackdrop show={true}></FilterBackdrop>
            </Col>
          </PublicLayout>
        )
      }
    >
      <Routes>
        <Route path="/" element={<IsAuthenticatedRoute />}>
          <Route index element={<Navigate to="/mapview" />} />
          {/**
           * MAPVIEW -- /mapview
           * -- Index page for the whole application.
           */}
          <Route path="mapview" element={<PrivateRoute claim={Claims.PROPERTY_VIEW} />}>
            <Route
              index
              element={
                <LayoutWrapper
                  component={MapView}
                  layout={AuthLayout}
                  title={getTitle('Map View')}
                />
              }
            />
            <Route
              path=":id"
              element={
                <LayoutWrapper
                  component={MapView}
                  layout={AuthLayout}
                  title={getTitle('Map View')}
                />
              }
            />
          </Route>
          {/**
           * PROPERTY LIST -- /properties/list
           * -- When selecting 'View Property Inventory' nav link.
           */}
          <Route path="/properties/list" element={<PrivateRoute claim={Claims.PROPERTY_VIEW} />}>
            <Route
              index
              element={
                <LayoutWrapper
                  component={PropertyListView}
                  layout={AuthLayout}
                  title={getTitle('View Inventory')}
                />
              }
            />
          </Route>
          {/**
           * ADMIN -- /admin
           * -- When selecting 'Administration' nav link.
           */}
          <Route path="/admin" element={<PrivateRoute claim={Claims.ADMIN_USERS} />}>
            <Route index element={<Navigate to="users" replace={true} />} />
            <Route
              path="access/requests"
              element={
                <LayoutWrapper
                  component={ManageAccessRequests}
                  layout={AuthLayout}
                  title={getTitle('Access Requests')}
                />
              }
            />
            <Route
              path="users"
              element={
                <LayoutWrapper
                  component={ManageUsers}
                  layout={AuthLayout}
                  title={getTitle('Users Management')}
                />
              }
            />
            <Route
              path="user/:id"
              element={
                <LayoutWrapper
                  component={EditUserPage}
                  layout={AuthLayout}
                  title={getTitle('Edit User')}
                />
              }
            />
            <Route
              path="agencies"
              element={
                <LayoutWrapper
                  component={ManageAgencies}
                  layout={AuthLayout}
                  title={getTitle('Agency Management')}
                />
              }
            />
            <Route
              path="agency/:id"
              element={
                <LayoutWrapper
                  component={EditAgencyPage}
                  layout={AuthLayout}
                  title={getTitle('Edit Agency')}
                />
              }
            />
            <Route
              path="agency/new"
              element={
                <LayoutWrapper
                  component={EditAgencyPage}
                  layout={AuthLayout}
                  title={getTitle('Edit Agency')}
                />
              }
            />
            <Route
              path="administrativeAreas"
              element={
                <LayoutWrapper
                  component={ManageAdminAreas}
                  layout={AuthLayout}
                  title={getTitle('Adminstrative Areas')}
                />
              }
            />
            <Route
              path="administrativeArea/:id"
              element={
                <LayoutWrapper
                  component={EditAdminArea}
                  layout={AuthLayout}
                  title={getTitle('Edit Adminstrative Area')}
                />
              }
            />
            <Route
              path="administrativeArea/new"
              element={
                <LayoutWrapper
                  component={EditAdminArea}
                  layout={AuthLayout}
                  title={getTitle('Create Administrative Area')}
                />
              }
            />
          </Route>
          {/**
           * DISPOSE -- /dispose
           * -- When selecting 'Create Disposal Project' from 'Disposal Projects' nav link.
           */}
          <Route path="/dispose" element={<PrivateRoute claim={Claims.PROJECT_ADD} />}>
            <Route
              index
              element={
                <LayoutWrapper
                  component={ProjectDisposeView}
                  layout={AuthLayout}
                  title={getTitle('Dispose Property')}
                />
              }
            />
            {/**
             * DISPOSE PROJECT FORM - DRAFT
             * STEP [1/6]
             */}
            <Route path="projects/draft" element={<PrivateRoute claim={Claims.PROJECT_ADD} />}>
              <Route
                index
                element={
                  <LayoutWrapper
                    component={ProjectDisposeView}
                    layout={AuthLayout}
                    title={getTitle('View SPL Projects')}
                  />
                }
              />
            </Route>
            {/**
             * DISPOSE PROJECT FORM - SELECT PROPERTIES
             * STEP [2/6]
             */}
            <Route path="projects/properties" element={<PrivateRoute claim={Claims.PROJECT_ADD} />}>
              <Route
                index
                element={
                  <LayoutWrapper
                    component={ProjectDisposeView}
                    layout={AuthLayout}
                    title={getTitle('View SPL Projects')}
                  />
                }
              />
            </Route>
            {/**
             * DISPOSE PROJECT FORM - UPDATE INFORMATION
             * STEP [3/6]
             */}
            <Route
              path="projects/information"
              element={<PrivateRoute claim={Claims.PROJECT_ADD} />}
            >
              <Route
                index
                element={
                  <LayoutWrapper
                    component={ProjectDisposeView}
                    layout={AuthLayout}
                    title={getTitle('View SPL Projects')}
                  />
                }
              />
            </Route>
            {/**
             * DISPOSE PROJECT FORM - REQUIRED DOCUMENTATION
             * STEP [4/6]
             */}
            <Route
              path="projects/documentation"
              element={<PrivateRoute claim={Claims.PROJECT_ADD} />}
            >
              <Route
                index
                element={
                  <LayoutWrapper
                    component={ProjectDisposeView}
                    layout={AuthLayout}
                    title={getTitle('View SPL Projects')}
                  />
                }
              />
            </Route>
            {/**
             * DISPOSE PROJECT FORM - APPROVAL
             * STEP [5/6]
             */}
            <Route path="projects/approval" element={<PrivateRoute claim={Claims.PROJECT_ADD} />}>
              <Route
                index
                element={
                  <LayoutWrapper
                    component={ProjectDisposeView}
                    layout={AuthLayout}
                    title={getTitle('View SPL Projects')}
                  />
                }
              />
            </Route>
          </Route>
          {/**
           * DISPOSE PROJECT FORM - REVIEW
           * STEP [6/6]
           */}
          <Route path="projects/review" element={<PrivateRoute claim={Claims.PROJECT_ADD} />}>
            <Route
              index
              element={
                <LayoutWrapper
                  component={ProjectDisposeView}
                  layout={AuthLayout}
                  title={getTitle('View SPL Projects')}
                />
              }
            />
          </Route>

          {/**
           * PROJECTS -- /projects
           */}
          <Route
            path="/projects"
            element={
              <PrivateRoute claim={Claims.PROJECT_ADD}>
                <LayoutWrapper
                  component={ProjectRouter}
                  layout={AuthLayout}
                  title={getTitle('Dispose Property')}
                />
              </PrivateRoute>
            }
          >
            {/**
             * PROJECTS INDEX ROUTE -- /projects
             * - When clicking on a project with status 'Submitted'.
             */}
            <Route
              index
              element={
                location.search.length > 0 ? (
                  <Navigate to={`assess/properties${location.search}`} />
                ) : (
                  <LayoutWrapper
                    title={getTitle('Page Not Found')}
                    component={NotFoundPage}
                    layout={PublicLayout}
                  />
                )
              }
            />
            {/**
             * PROJECTS LIST -- /projects/list
             * - When clicking on 'View Projects' from 'Disposal Projects' nav link.
             */}
            <Route path="list" element={<PrivateRoute claim={Claims.PROJECT_VIEW} />}>
              <Route
                index
                element={
                  <LayoutWrapper
                    component={ProjectListView}
                    layout={AuthLayout}
                    title={getTitle('View Projects')}
                  />
                }
              />
            </Route>
            <Route
              path="summary"
              element={
                <LayoutWrapper layout={AuthLayout} component={ProjectSummary}></LayoutWrapper>
              }
            />
            <Route
              path="approval/requests"
              element={
                <PrivateRoute claim={Claims.DISPOSE_APPROVE}>
                  <LayoutWrapper
                    component={ProjectApprovalRequestListView}
                    layout={AuthLayout}
                    title={getTitle('Surplus Property Program Projects - Approval Requests')}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="assess/properties"
              element={
                <PrivateRoute
                  claim={[Claims.ADMIN_PROJECTS, Claims.DISPOSE_APPROVE]}
                ></PrivateRoute>
              }
            >
              <Route
                index
                element={
                  <LayoutWrapper layout={AuthLayout} component={ReviewApproveStep}></LayoutWrapper>
                }
              />
              <Route
                path="update"
                element={
                  <LayoutWrapper
                    layout={AuthLayout}
                    component={SelectProjectPropertiesPage}
                  ></LayoutWrapper>
                }
              />
            </Route>
            <Route path="spl" element={<PrivateRoute claim={Claims.PROJECT_VIEW} />}>
              <Route
                index
                element={
                  <LayoutWrapper
                    component={SPLProjectListView}
                    layout={AuthLayout}
                    title={getTitle('View SPL Projects')}
                  />
                }
              />
            </Route>

            {/**
             * DISPOSAL PROJECTS -- /projects/disposal
             * - When clicking on a project with status 'Approved for *'.
             */}
            <Route path="disposal" element={<PrivateRoute claim={Claims.PROJECT_ADD} />}>
              <Route
                path=":id"
                element={
                  <LayoutWrapper
                    component={ProjectLayout}
                    layout={AuthLayout}
                    title={getTitle('Disposal Project')}
                  />
                }
              >
                {/**
                 * DISPOSAL PROJECTS INDEX ROUTE -- /projects/disposal/:id
                 * - Routes to /information from the current :id path.
                 */}
                <Route
                  index
                  element={<Navigate to={`${location.pathname}/information`} replace={true} />}
                />
                <Route
                  path="information"
                  element={<LayoutWrapper component={ProjectInformationTabs} />}
                >
                  {/** INFORMATION TABS INDEX ROUTE -- Index specifies the selected nested tab. */}
                  <Route index element={<ProjectInformation />} />
                  <Route path="properties" element={<ProjectProperties />} />
                </Route>
                <Route
                  path="documentation"
                  element={<LayoutWrapper component={ProjectDocumentation} />}
                />
                <Route path="erp" element={<LayoutWrapper component={ProjectERPTabs} />}>
                  {/** ERP TABS INDEX ROUTE -- Index specifies the selected nested tab. */}
                  <Route index element={<ProjectERPApproval />} />
                  <Route path="exemption" element={<ProjectERPExemption />} />
                  <Route path="complete" element={<ProjectERPComplete />} />
                  <Route path="disposed" element={<ProjectERPDisposed />} />
                </Route>
                <Route path="not/spl" element={<LayoutWrapper component={ProjectNotSPL} />} />
                <Route path="spl" element={<LayoutWrapper component={ProjectSPLTabs} />}>
                  {/** SPL TABS INDEX ROUTE -- Index specifies the selected nested tab. */}
                  <Route index element={<ProjectSPLApproval />} />
                  <Route path="marketing" element={<ProjectSPLMarketing />} />
                  <Route path="contract/in/place" element={<ProjectSPLContractInPlace />} />
                  <Route path="transfer/within/gre" element={<ProjectSPLTransferWithinGRE />} />
                </Route>
                <Route path="close/out" element={<LayoutWrapper component={ProjectCloseOut} />} />
                <Route
                  path="notifications"
                  element={<LayoutWrapper component={ProjectNotifications} />}
                />
              </Route>
            </Route>
          </Route>
          <Route path="/reports/spl" element={<PrivateRoute claim={Claims.REPORTS_SPL} />}>
            <Route
              index
              element={
                <LayoutWrapper
                  component={SplReportContainer}
                  layout={AuthLayout}
                  title={getTitle('SPL Reports')}
                />
              }
            />
          </Route>
        </Route>
        <Route
          path="/login"
          element={
            <LayoutWrapper title={getTitle('Login')} component={Login} layout={PublicLayout} />
          }
        />
        <Route
          path="/logout"
          element={<LayoutWrapper title={getTitle('Logout')} component={LogoutPage} />}
        />
        <Route
          path="/access/request"
          element={
            <LayoutWrapper
              component={AccessRequestPage}
              layout={AuthLayout}
              title={getTitle('Request Access')}
            />
          }
        />
        <Route
          path="/ienotsupported"
          element={
            <LayoutWrapper
              title={getTitle('IE Not Supported')}
              component={IENotSupportedPage}
              layout={PublicLayout}
            />
          }
        />
        <Route
          path="/forbidden"
          element={
            <LayoutWrapper
              title={getTitle('Forbidden')}
              component={AccessDenied}
              layout={PublicLayout}
            />
          }
        />
        <Route
          path="*"
          element={
            <LayoutWrapper
              title={getTitle('Page Not Found')}
              component={NotFoundPage}
              layout={PublicLayout}
            />
          }
        />
        <Route
          path="/test"
          element={
            <LayoutWrapper title={getTitle('Test')} component={Test} layout={PublicLayout} />
          }
        />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
