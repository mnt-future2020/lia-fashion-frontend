"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { UserRound, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { removeAuthToken, getAuthToken } from '@/lib/auth';
import { toast } from 'react-toastify';
import axios from '../../../lib/axios';

const DashboardHeader = ({ headerName }) => {
  const router = useRouter();
  const { updateAuth } = useAuth();
  const [company, setCompany] = useState(null);

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const response = await axios.get('/api/admin/company');
        setCompany(response.data);
      } catch (error) {
        // console.error('Error fetching company data:', error);
      }
    };

    fetchCompanyData();
  }, []);

  const handleLogout = async () => {
    try {
      const token = getAuthToken();
      await axios.post('/api/admin/logout', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      removeAuthToken();
      updateAuth({ isAuthenticated: false });
      toast.success('Logged out successfully', {
        position: "top-right",
        autoClose: 2000,
        onClose: () => router.push('/admin/login')
      });
    } catch (error) {
      // console.error('Logout failed:', error);
      toast.error('Logout failed, redirecting...', {
        position: "top-right",
        autoClose: 2000,
        onClose: () => {
          removeAuthToken();
          updateAuth({ isAuthenticated: false });
          router.push('/admin/login');
        }
      });
    }
  };

  return (
    <header className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0 bg-pink-50 p-4 rounded-lg shadow-md">
      <h1 className="text-2xl md:text-3xl font-bold text-center md:text-left text-[#eb1c75]">
        {headerName}
      </h1>
      <div className="relative">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="cursor-pointer">
              <Avatar className="h-10 w-10 rounded-full border-2 border-white">
                <AvatarImage
                  src={company?.logo || "https://github.com/shadcn.png"}
                  alt={company?.store_name || "Company Logo"}
                  width={40}
                  height={40}
                />
                <AvatarFallback>
                  {company?.store_name 
                    ? company.store_name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 3)
                    : 'KAN'}
                </AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48" align="end">
            <Link href="/">
              <DropdownMenuItem className="cursor-pointer text-pink-600 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mr-2 h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9m0 0l9 9m-9-9v18" />
                </svg>
                <span className="text-base">Home</span>
              </DropdownMenuItem>
            </Link>
            <Link href="/admin/dashboard/settings">
              <DropdownMenuItem className="cursor-pointer text-pink-600 font-medium">
                <UserRound className="mr-2 h-6 w-6" />
                <span className="text-base">Profile</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem 
              className="cursor-pointer text-pink-600 font-medium"
              onClick={handleLogout}
            >
              <Power className="mr-2 h-6 w-6" />
              <span className="text-base">Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;