import React from 'react';
import type { PropsWithChildren } from 'react';

const PublicLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        {children}
      </div>
    </div>
  );
};

export default PublicLayout;
