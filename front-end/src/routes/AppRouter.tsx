import React from 'react';
import { Routes, Route, Outlet, BrowserRouter } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import PublicLayoutBox from './layouts/PublicLayoutBox';
import PrivateLayout from './layouts/PrivateLayout';
import RoleProtectedRoute from './RoleProtectedRoute';
import SharedRegister from '../pages/auth/SharedRegister';
import SharedLogin from '../pages/auth/SharedLogin';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import EmailVerification from '../pages/auth/EmailVerification';
import ResendVerification from '../pages/auth/ResendVerification';
import Home from '../pages/Home';
import CompanyListing from '../pages/public/CompanyListing';
import CompanyDetail from '../pages/public/CompanyDetail';
import JobListing from '../pages/public/JobListing';
import JobDetail from '../pages/public/JobDetail';
import JobPreview from '../pages/public/JobPreview';
import NotFound from '../pages/public/NotFound';
// User pages
import UserDashboard from '../pages/user/UserDashboard';
import LikedJobs from '../pages/user/LikedJobs';
import SubscribedCompanies from '../pages/user/SubscribedCompanies';
import CVManagement from '../pages/user/CVManagement';
import MyApplications from '../pages/user/MyApplications';
// Admin pages
import * as Admin from '../pages/admin';
// Recruiter pages
import RecruiterDashboard from '../pages/recruiter/Dashboard';
import RecruiterJobManagement from '../pages/recruiter/job/JobManagement';
import RecruiterCVManagement from '../pages/recruiter/CVManagement';
import CompanyManage from '../pages/recruiter/company/CompanyManage';
import CampaignManagement from '../pages/recruiter/campaign/CampaignManagement';
import CampaignDetail from '../pages/recruiter/campaign/CampaignDetail';
import JobApplications from '../pages/recruiter/job/JobApplications';
import CVApplicationsManagement from '../pages/recruiter/CVApplicationsManagement';
import CandidateSearch from '../pages/recruiter/CandidateSearch';

// Layout wrappers for nested routes
const PublicLayoutWrapper: React.FC = () => (
  <PublicLayout>
    <Outlet />
  </PublicLayout>
);

const PublicLayoutBoxWrapper: React.FC = () => (
  <PublicLayoutBox>
    <Outlet />
  </PublicLayoutBox>
);

const PrivateLayoutWrapper: React.FC = () => (
  <PrivateLayout>
    <Outlet />
  </PrivateLayout>
);

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route element={<PublicLayoutWrapper />}>          
          <Route path="/dang-nhap" element={<SharedLogin />} />
          <Route path="/dang-nhap-nha-tuyen-dung" element={<SharedLogin />} />
          <Route path="/admin/dang-nhap" element={<SharedLogin />} />
          <Route path="/dang-ky" element={<SharedRegister />} />
          <Route path="/dang-ky-nha-tuyen-dung" element={<SharedRegister />} />
          <Route path="/quen-mat-khau" element={<ForgotPassword />} />
          <Route path="/dat-lai-mat-khau" element={<ResetPassword />} />
          <Route path="/xac-thuc-email" element={<EmailVerification />} />
          <Route path="/gui-lai-xac-thuc" element={<ResendVerification />} />
        </Route>

        {/* Public routes with header and footer */}
        <Route element={<PublicLayoutBoxWrapper />}>
          <Route path="/" element={<Home />} />
          <Route path="/cong-ty" element={<CompanyListing />} />
          <Route path="/cong-ty/:id" element={<CompanyDetail />} />
          <Route path="/viec-lam" element={<JobListing />} />
          <Route path="/viec-lam/:id" element={<JobDetail />} />
          <Route path="/viec-lam/preview/:id" element={<JobPreview />} />
        </Route>

        {/* User routes */}
        <Route
          element={
            <RoleProtectedRoute>
              <PrivateLayoutWrapper />
            </RoleProtectedRoute>
          }
        >
          <Route path="/bang-dieu-khien" element={<UserDashboard />} />
          <Route path="/cong-viec-da-thich" element={<LikedJobs />} />
          <Route path="/cong-ty-theo-doi" element={<SubscribedCompanies />} />
          <Route path="/quan-ly-cv" element={<CVManagement />} />
          <Route path="/don-ung-tuyen" element={<MyApplications />} />
        </Route>

        {/* Recruiter routes */}
        <Route
          element={
            <RoleProtectedRoute allowedRoles={['recruiter']}>
              <PrivateLayoutWrapper />
            </RoleProtectedRoute>
          }
        >
          <Route path="/nha-tuyen-dung/bang-dieu-khien" element={<RecruiterDashboard />} />
          <Route path="/nha-tuyen-dung/quan-ly-cong-ty" element={<CompanyManage />} />
          <Route path="/nha-tuyen-dung/quan-ly-tin-tuyen-dung" element={<RecruiterJobManagement />} />
          <Route path="/nha-tuyen-dung/quan-ly-tin-tuyen-dung/:jobId/ung-vien" element={<JobApplications />} />
          <Route path="/nha-tuyen-dung/quan-ly-cv-ung-tuyen" element={<CVApplicationsManagement />} />
          <Route path="/nha-tuyen-dung/tim-kiem-ung-vien" element={<CandidateSearch />} />
          <Route path="/nha-tuyen-dung/quan-ly-chien-dich" element={<CampaignManagement />} />
          <Route path="/nha-tuyen-dung/chien-dich/:id" element={<CampaignDetail />} />
          <Route path="/nha-tuyen-dung/quan-ly-cv" element={<RecruiterCVManagement />} />
        </Route>

        {/* Admin routes */}
        <Route
          element={
            <RoleProtectedRoute allowedRoles={['admin']} redirectPath="/admin/dang-nhap">
              <PrivateLayoutWrapper />
            </RoleProtectedRoute>
          }
        >
          <Route path="/admin/bang-dieu-khien" element={<Admin.Dashboard />} />
          <Route path="/admin/quan-ly-vai-tro" element={<Admin.RoleManagement />} />
          <Route path="/admin/quan-ly-nguoi-dung" element={<Admin.UserManagement />} />
          <Route path="/admin/quan-ly-cong-ty" element={<Admin.AdminCompanyManagement />} />
          <Route path="/admin/quan-ly-cong-viec" element={<Admin.UnifiedJobManagement />} />
          <Route path="/admin/quan-ly-nganh-nghe" element={<Admin.IndustryManagement />} />
          <Route path="/admin/quan-ly-template-cv" element={<Admin.AdminCVTemplateManagement />} />
          <Route path="/admin/quan-ly-cv" element={<Admin.AdminCVManagement />} />
          <Route path="/admin/quan-ly-hinh-anh" element={<Admin.MediaManagement />} />
          <Route path="/admin/quan-ly-thong-bao" element={<Admin.NotificationManagement />} />
          <Route path="/admin/cai-dat" element={<Admin.SettingsManagement />} />
        </Route>

        {/* Catch-all route for undefined routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
