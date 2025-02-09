import {ReactNode} from 'react'
import {
  createBrowserRouter,
  createRoutesFromElements,
  redirect,
  Route,
  RouterProvider,
  useRouteLoaderData,
} from 'react-router-dom'

import {LoginModal, registerAction, RegisterModal} from './pages/components'
import {InstructorDashboard, StudentDashboard} from './pages/dashboard/page'
import {InstructorHistory, StudentHistory} from './pages/history/page'
import {Layout} from './pages/layout'
import {loginAction} from './pages/login/page'
import {NotFound} from './pages/not-found'
import {LandingPage} from './pages/page'
import {purchaseLoader} from './pages/purchase/loader'
import {StudentPurchase} from './pages/purchase/page'
import {PurchaseSuccessPage} from './pages/purchase/success/page'
import {StudentReservation} from './pages/reservation/page'
import {StudentSchedule} from './pages/reservation/schedule/page'
import {searchPageLoader} from './pages/reservation/search/loader'
import {SearchPage} from './pages/reservation/search/page'
import {sessionProvider, UserRole} from './utils/session'

export function App() {
  return (
    <>
      <RouterProvider router={router} fallbackElement={<p>Initial Load...</p>} />
    </>
  )
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="*" element={<NotFound />} />
      <Route path="/" element={<LandingPage />} errorElement={<LandingPage />}>
        <Route
          path="/login"
          action={loginAction}
          element={<LoginModal />}
          errorElement={<LoginModal />}
        />
        <Route
          path="/register"
          action={registerAction}
          element={<RegisterModal />}
          errorElement={<RegisterModal />}
        />
        <Route path="/register/success" element={<RegisterModal.Success />} />
      </Route>
      <Route
        id="root"
        loader={checkAuthLoader}
        element={<Layout />}
        errorElement={<Layout.ErrorBoundary />}
      >
        <Route
          path="/dashboard"
          element={
            <RequireRole>
              {(isStudent) => (isStudent ? <StudentDashboard /> : <InstructorDashboard />)}
            </RequireRole>
          }
        />
        <Route
          path="/history"
          element={
            <RequireRole>
              {(isStudent) => (isStudent ? <StudentHistory /> : <InstructorHistory />)}
            </RequireRole>
          }
        />
        <Route
          path="/reservation"
          element={<RequireRole>{(isStudent) => isStudent && <StudentReservation />}</RequireRole>}
        >
          <Route
            path="/reservation/"
            index
            element={<RequireRole>{(isStudent) => isStudent && <StudentSchedule />}</RequireRole>}
          />
          <Route
            path="/reservation/search"
            loader={searchPageLoader}
            element={<RequireRole>{(isStudent) => isStudent && <SearchPage />}</RequireRole>}
          />
        </Route>
        <Route
          path="/purchase"
          loader={purchaseLoader}
          element={<RequireRole>{(isStudent) => isStudent && <StudentPurchase />}</RequireRole>}
        />
        <Route
          path="/purchase/success"
          element={<RequireRole>{(isStudent) => isStudent && <PurchaseSuccessPage />}</RequireRole>}
        />
      </Route>
    </>,
  ),
)

async function checkAuthLoader() {
  if (!sessionProvider.session) {
    return redirect('/')
  }
  return sessionProvider.session.role
}

interface RequireRoleProps {
  children: ReactNode | ((arg: any) => ReactNode)
}

function RequireRole({children}: RequireRoleProps) {
  const role = useRouteLoaderData('root') as UserRole
  return <>{typeof children === 'function' ? children(role === 'STUDENT') : children}</>
}
