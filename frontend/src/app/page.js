'use client';

import Auth from '@/components/Auth';
import { Toaster } from 'react-hot-toast';

export default function Home() {
  return (
    <>
      <Auth />
      <Toaster position="top-center" />
    </>
  );
}
