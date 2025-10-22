import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  postedDate: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [jobs] = useState<Job[]>([
    {
      id: 1,
      title: 'Frontend Developer',
      company: 'Tech Corp',
      location: 'Hanoi, Vietnam',
      salary: '$1,200 - $1,800',
      description:
        'We are looking for an experienced Frontend Developer to join our team.',
      postedDate: '2023-06-15',
    },
    {
      id: 2,
      title: 'Backend Engineer',
      company: 'Innovation Labs',
      location: 'Ho Chi Minh City, Vietnam',
      salary: '$1,500 - $2,200',
      description: 'Join our backend team to build scalable web services.',
      postedDate: '2023-06-10',
    },
    {
      id: 3,
      title: 'Full Stack Developer',
      company: 'StartupXYZ',
      location: 'Da Nang, Vietnam',
      salary: '$1,000 - $1,600',
      description:
        'Looking for a versatile developer to work on both frontend and backend.',
      postedDate: '2023-06-05',
    },
  ]);

  const handleLogin = () => {
    navigate('/dang-nhap');
  };

  const handleRegister = () => {
    navigate('/dang-ky');
  };

  const handlePostJob = () => {
    // For now, redirect to login since this feature requires authentication
    navigate('/dang-nhap');
  };

  return (
    <div>
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
          Tìm Công Việc Mơ Ước Của Bạn
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-700 md:text-xl">
          Khám phá hàng nghìn cơ hội việc làm từ các công ty hàng đầu tại Việt
          Nam
        </p>
      </div>

      {/* Search Bar */}
      <div className="mx-auto mb-12 max-w-3xl">
        <div className="flex rounded-lg bg-white p-2 shadow-md">
          <input
            type="text"
            placeholder="Tên công việc, công ty hoặc từ khóa"
            className="flex-grow px-4 py-3 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Địa điểm"
            className="flex-grow border-l border-gray-200 px-4 py-3 focus:outline-none"
          />
          <button className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors duration-300 hover:bg-blue-700 cursor-pointer">
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Job Listings */}
      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          Công Việc Mới Nhất
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="overflow-hidden rounded-lg bg-white shadow-md transition-shadow duration-300 hover:shadow-lg"
            >
              <div className="p-6">
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {job.title}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {job.postedDate}
                  </span>
                </div>
                <p className="mb-2 font-medium text-blue-600">
                  {job.company}
                </p>
                <p className="mb-3 text-sm text-gray-600">{job.location}</p>
                <p className="mb-4 text-gray-700">{job.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-green-600">
                    {job.salary}
                  </span>
                  <button className="rounded-lg px-4 py-2 font-medium text-blue-600 transition-colors duration-300 hover:bg-blue-50 cursor-pointer">
                    Ứng Tuyển
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="mb-12">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
          Tại Sao Chọn Chúng Tôi
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 text-center shadow-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold">
              Nhà Tuyển Dụng Đã Xác Minh
            </h3>
            <p className="text-gray-600">
              Làm việc với các công ty uy tín và nhà tuyển dụng đã được xác
              minh.
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 text-center shadow-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold">Nền Tảng Bảo Mật</h3>
            <p className="text-gray-600">
              Dữ liệu của bạn được bảo vệ với tiêu chuẩn bảo mật ngành.
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 text-center shadow-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold">
              Phát Triển Sự Nghiệp
            </h3>
            <p className="text-gray-600">
              Tìm cơ hội giúp bạn phát triển sự nghiệp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
