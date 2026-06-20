'use client';
import { useEffect, useState } from "react";
import axios from '../lib/axios';
import Navbar from "@/components/Webpage/Navbar/Navbar";
import Footer from "@/components/Webpage/Footer/Footer";
import Hero from "@/components/Webpage/Home/Hero/Hero";
import dynamic from "next/dynamic";
const PromoModalClient = dynamic(() => import("@/components/Marketing/PromoModalClient"), { ssr: false });
import MidBanner from "@/components/Webpage/Home/MidBanner/MidBanner";
import Testimonials from "@/components/Webpage/Home/Testimonials/Testimonials";
import TestimonialsButton from "@/components/Webpage/Home/Testimonials/TestimonialsButton";
import SecondSection from "@/components/Webpage/Home/SecondSection/SecondSection";
import HotSellingSection from "@/components/Webpage/Home/HotSellingSection/HotSellingSection";
import NewArrivalsSection from "@/components/Webpage/Home/NewArrivalsSection/NewArrivalsSection";
import LimitedSection from "@/components/Webpage/Home/LimitedSection/LimitedSection";
import TrendingSection from "@/components/Webpage/Home/Trendingsection/TrendingSection";
import PremiumSection from "@/components/Webpage/Home/PremiumSection/PremiumSection";

import Categories from "@/components/Webpage/Home/Categories2/Categories";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUserAuth } from "@/contexts/UserAuthContext";
import BestSellerSection from './../components/Webpage/Home/BestSellerSection/BestSellerSection';
import SubcategoriesSection from "@/components/Webpage/Home/SubcategoriesSection/SubcategoriesSection";

export default function Home() {
  const { isAuthenticated, isLoading } = useUserAuth();
  const [settings, setSettings] = useState({
    tel: '+91 93844 09680',
    email: '@gmail.com',
    location: 'Pondicherry'
  });

  // Fetch settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get('/api/company'); // Use public endpoint
        if (response.data) {
          // Map company data to settings format
          const companyData = response.data;
          const location = `${companyData.district || ''}, ${companyData.state || ''}`.replace(/^,\s*|,\s*$/g, '') || settings.location;
          
          setSettings({
            tel: companyData.mobile_no || companyData.landline_no || settings.tel,
            email: companyData.email || settings.email,
            location: location
          });
        }
      } catch (error) {
        // console.error('Failed to fetch company details:', error);
        // Keep default values if API fails
      }
    };

    fetchSettings();
  }, []);

  // Handle smooth scrolling to sections on page load
  useEffect(() => {
    const handleHashNavigation = () => {
      const hash = window.location.hash;
      if (hash) {
        // Small delay to ensure page is fully loaded
        setTimeout(() => {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }, 100);
      }
    };

    // Handle initial load
    handleHashNavigation();

    // Handle hash changes (when navigating with hash links)
    window.addEventListener('hashchange', handleHashNavigation);
    
    return () => {
      window.removeEventListener('hashchange', handleHashNavigation);
    };
  }, []);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main>
        {/* Dynamic Promo Modal (client-only) - 5s delay */}
        <PromoModalClient page="home" delayMs={5000} />
        <Hero />
       
        <Categories />
        <div id="hot-selling">
          <HotSellingSection />
        </div>
        <div id="best-seller">
          <BestSellerSection />
        </div>
        <div id="trending-products">
          <TrendingSection />
        </div>
        <MidBanner />
        <div id="new-arrivals">
          <NewArrivalsSection />
        </div>
        <div id="limited-products">
          <LimitedSection />
        </div>
        <div id="premium-products">
          <PremiumSection />
        </div>
        {/* <div id="hot-selling">
          <HotSellingSection />
        </div>
        <MidBanner />
        <div id="new-arrivals">
          <NewArrivalsSection />
        </div>
        <div id="limited-products">
          <LimitedSection />
        </div> */}
        <div id="subcategories">
          <SubcategoriesSection />
        </div>
        <Testimonials />
        <TestimonialsButton />
      </main>
      <Footer />
    </>
  );
}