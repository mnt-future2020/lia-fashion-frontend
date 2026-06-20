"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu, User, ShoppingCart, X, ChevronDown, Search, Phone, Mail, Facebook, Instagram } from "lucide-react"
import { optimizeCloudinary } from "@/lib/utils"
import { FaThreads } from "react-icons/fa6"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePathname } from 'next/navigation'
import { useUserAuth } from "@/contexts/UserAuthContext"
import { useUserCart } from '@/contexts/UserCartContext'
import axios from '../../../lib/axios'
import { cn } from "@/lib/utils"
import Cookies from 'js-cookie'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [company, setCompany] = useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState(null)
  const pathname = usePathname()
  const { isAuthenticated, user, logout } = useUserAuth()
  const { cartCount } = useUserCart()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get('/api/admin/categories')
        setCategories(data)
      } catch (error) {
        // console.error('Failed to fetch categories:', error)
      }
    }

    const fetchCompany = async () => {
      try {
        const res = await axios.get("/api/company")
        setCompany(res.data)
      } catch (error) {
        // console.error('Failed to fetch company data:', error)
        setCompany(null)
      }
    }

    fetchCategories()
    fetchCompany()
    setIsAdmin(!!Cookies.get('admin-token'))
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const renderAuthButton = () => {
    if (isAdmin) {
      return (
        <Button variant="default" asChild className="bg-[#eb1c75] text-white hover:bg-pink-700">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <User className="h-7 w-7" />
            <span>Dashboard</span>
          </Link>
        </Button>
      )
    }
    if (isAuthenticated && user) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" className="bg-[#eb1c75] text-white hover:bg-pink-700">
              <User className="h-7 w-7 mr-2" />
              <span>Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/user/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/user/orders">Orders</Link>
            </DropdownMenuItem>
            {/* <DropdownMenuItem asChild>
              <Link href="/user/wishlist">Wishlist</Link>
            </DropdownMenuItem> */}
     
            <DropdownMenuItem onClick={() => logout()}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    return (
      <Button variant="default" asChild className="bg-[#eb1c75] text-white hover:bg-pink-700 hidden md:flex">
        <Link href="/login" className="flex items-center gap-2">
          <User className="h-7 w-7" />
          <span>Login</span>
        </Link>
      </Button>
    )
  }

  // Add function to check if a category link is active
  const isCategoryActive = (categoryId) => {
    return pathname.includes(`/category/${categoryId}`);
  };

  // Add helper function to check active state
  const isLinkActive = (path) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="w-full borter-b border-gray-300 bg-white shadow-sm">
      {/* Announcement Bar */}
      <div className="w-full bg-pink-600 text-white py-2 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center">
            {/* Contact Info */}
            <div className="hidden lg:flex items-center space-x-4 text-sm">
              {company?.mobile_no && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  <span>{company.mobile_no}</span>
                </div>
              )}
              {company?.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  <span>{company.email}</span>
                </div>
              )}
            </div>

            {/* Welcome Text */}
            <p className="text-sm text-center md:text-center block w-full md:w-auto">Welcome to Lia Fashions</p>

            {/* Social Media Icons */}
            <div className="hidden md:flex items-center space-x-3 justify-end">
              <Link href="https://www.facebook.com/share/1A3NdSQkxN/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="hover:text-white/80 transition-colors">
                <Facebook className="h-4 w-4" />
              </Link>
              <Link href="https://www.threads.com/@lia_fashion_py" target="_blank" rel="noopener noreferrer" className="hover:text-white/80 transition-colors">
                <FaThreads className="h-4 w-4" />
              </Link>
              <Link href="https://www.instagram.com/lia_fashion_py?igsh=MWRtam5sdnlvdmthcA%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="hover:text-white/80 transition-colors">
                <Instagram className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <div className="relative rounded-full overflow-hidden mr-2">
              {/* Replace with your actual logo */}
              <Image
                src="/assets/images/logo.png"
                alt="Logo"
                width={90}
                height={90}
                className="object-cover"
              />
            </div>
          </Link>
        </div>

        {/* Desktop Navigation with Enhanced Dropdown */}
        <nav className="hidden lg:flex items-center text-base space-x-8">
          <Link
            href="/"
            className={cn(
              "relative text-gray-700 font-medium py-2 transition-colors duration-200",
              isLinkActive('/') ? "text-[#eb1c75]" : "hover:text-[#eb1c75]",
              "after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#eb1c75]",
              isLinkActive('/') ? "after:w-full" : "after:w-0 hover:after:w-full after:transition-all after:duration-300"
            )}
          >
            Home
          </Link>
          
          {/* Categories Dropdown */}
          <div className="relative group">
            <Button 
              variant="ghost" 
              className={cn(
                "font-medium text-base py-2 relative transition-colors duration-200",
                isLinkActive('/category') ? "text-[#eb1c75]" : "hover:text-[#eb1c75]",
                "after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#eb1c75]",
                isLinkActive('/category') ? "after:w-full" : "after:w-0 hover:after:w-full after:transition-all after:duration-300"
              )}
            >
              <span>Categories</span>
              <ChevronDown className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
            </Button>

            {/* Main Categories Dropdown */}
            <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute left-0 top-full pt-2 w-64 z-50 transition-all duration-200">
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2">
                {categories.map((category) => (
                  <div 
                    key={category.id}
                    className="relative group/item"
                  >
                    <div 
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 h-[60px]",
                        "hover:bg-pink-50",
                        isCategoryActive(category.id) && "bg-pink-50 text-[#eb1c75]"
                      )}
                    >
                      {category.image && (
                        <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
                          <Image
                            src={optimizeCloudinary(category.image)}
                            alt={category.name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex flex-col flex-1">
                        <Link 
                          href={`/category/${category.id}`}
                          className={cn(
                            "text-sm font-medium",
                            isCategoryActive(category.id) ? "text-[#eb1c75]" : "text-gray-700"
                          )}
                        >
                          {category.name}
                        </Link>
                      </div>
                      {category.subcategories?.length > 0 && (
                        <ChevronDown className="h-4 w-4 text-gray-400 transition-transform duration-200 group-hover/item:-rotate-90" />
                      )}
                    </div>

                    {/* Subcategories Dropdown */}
                    {category.subcategories?.length > 0 && (
                      <div className="absolute left-full top-0 pl-1 min-w-[200px] invisible group-hover/item:visible opacity-0 group-hover/item:opacity-100 transition-all duration-200">
                        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2">
                          {category.subcategories.map((subcategory) => (
                            <Link 
                              key={subcategory.id}
                              href={`/category/${category.id}/${subcategory.id}`}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 h-[50px]",
                                "hover:bg-pink-50/70",
                                pathname.includes(`/category/${category.id}/${subcategory.id}`) && "bg-pink-50/70 text-[#eb1c75]"
                              )}
                            >
                              {subcategory.image && (
                                <div className="w-6 h-6 rounded-md overflow-hidden flex-shrink-0">
                                  <Image
                                    src={optimizeCloudinary(subcategory.image)}
                                    alt={subcategory.name}
                                    width={24}
                                    height={24}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <span className={cn(
                                "text-xs font-medium",
                                pathname.includes(`/category/${category.id}/${subcategory.id}`) ? "text-[#eb1c75]" : "text-gray-600"
                              )}>
                                {subcategory.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Link
            href="/about"
            className={cn(
              "relative text-gray-700 font-medium py-2 transition-colors duration-200",
              isLinkActive('/about') ? "text-[#eb1c75]" : "hover:text-[#eb1c75]",
              "after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#eb1c75]",
              isLinkActive('/about') ? "after:w-full" : "after:w-0 hover:after:w-full after:transition-all after:duration-300"
            )}
          >
            About us
          </Link>
          
          <Link
            href="/contact"
            className={cn(
              "relative text-gray-700 font-medium py-2 transition-colors duration-200",
              isLinkActive('/contact') ? "text-[#eb1c75]" : "hover:text-[#eb1c75]",
              "after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#eb1c75]",
              isLinkActive('/contact') ? "after:w-full" : "after:w-0 hover:after:w-full after:transition-all after:duration-300"
            )}
          >
            Contact us
          </Link>
        </nav>

        {/* Icons */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Search Input for Products */}
          <form
            onSubmit={e => {
              e.preventDefault();
              const searchValue = e.target.elements.navSearch.value.trim();
              
              // Clear all filter localStorage when searching from navbar
              if (typeof window !== 'undefined') {
                // Clear products page filters
                localStorage.removeItem('productsPageFilters');
                
                // Clear any category page filters (we don't know which category they were viewing)
                // Get all localStorage keys and remove category filter keys
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (key && key.startsWith('subcategoryFilters_')) {
                    keysToRemove.push(key);
                  }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
                
                // Clear navigation flag for fresh start
                sessionStorage.removeItem('navigatingToProduct');
              }
              
              if (searchValue) {
                window.location.href = `/products?search=${encodeURIComponent(searchValue)}`;
              } else {
                window.location.href = '/products';
              }
            }}
            className="relative w-38 sm:w-48 md:w-64 lg:w-72 max-w-[calc(100vw-120px)]"
            role="search"
            autoComplete="off"
          >
            <input
              type="text"
              name="navSearch"
              placeholder="Search by Products,SKU..."
              className="pl-2 pr-7 py-1.5 w-full rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-200 text-xs sm:text-sm bg-white placeholder:text-xs sm:placeholder:text-sm whitespace-nowrap overflow-x-scroll no-scrollbar"
              defaultValue={typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('search') || '') : ''}
              aria-label="Search"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500">
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </form>
          <Button variant="ghost" size="icon" asChild className="relative w-12 h-12 sm:w-10 sm:h-10">
            <Link href="/user/cart">
              <ShoppingCart className="h-8 w-8 sm:h-5 sm:w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-sm sm:text-xs rounded-full h-6 w-6 sm:h-5 sm:w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </Button>
          <div className="hidden lg:block">
          {renderAuthButton()}
          </div>
          <Button variant="ghost" size="icon" className="w-12 h-12 sm:w-10 sm:h-10 lg:hidden" onClick={toggleMenu}>
            {isMenuOpen ? <X className="h-8 w-8 sm:h-5 sm:w-5" /> : <Menu className="h-8 w-8 sm:h-5 sm:w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu with Enhanced Dropdown */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300 lg:hidden", 
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMenuOpen(false)}
      />
      <div 
        className={cn(
          "fixed right-0 top-0 h-full w-[300px] sm:w-[350px] bg-white z-50 transform transition-all duration-300 ease-out lg:hidden",
          "overflow-y-auto shadow-xl border-l",
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold text-lg text-gray-800">Menu</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMenuOpen(false)}
              className="hover:bg-pink-50 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-gray-600 hover:text-pink-600" />
            </Button>
          </div>

          {/* User Section */}
          <div className="p-4 bg-gradient-to-r from-pink-50 to-pink-100/50">
            {isAdmin ? (
              <Button 
                variant="default" 
                className="w-full bg-[#eb1c75] text-white hover:bg-[#d81b6b] transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                asChild
              >
                <Link 
                  href="/admin/dashboard" 
                  className="flex items-center justify-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
              </Button>
            ) : isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center shadow-inner">
                    <User className="h-6 w-6 text-pink-500" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    href="/user/profile"
                    className="bg-white px-3 py-2 rounded-md text-sm text-center transition-all hover:bg-pink-50 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/user/orders"
                    className="bg-white px-3 py-2 rounded-md text-sm text-center transition-all hover:bg-pink-50 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Orders
                  </Link>
                </div>
              </div>
            ) : (
              <Button 
                variant="default" 
                className="w-full bg-[#eb1c75] text-white hover:bg-[#d81b6b] transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                asChild
              >
                <Link 
                  href="/login" 
                  className="flex items-center justify-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  <span>Login</span>
                </Link>
              </Button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              <Link
                href="/"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md w-full transition-all duration-200",
                  isLinkActive('/') 
                    ? "bg-pink-50 text-[#eb1c75] font-medium shadow-sm" 
                    : "text-gray-700 hover:bg-pink-50/50 hover:text-[#eb1c75] hover:shadow-sm hover:-translate-x-0.5"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>

              {/* Categories Dropdown for Mobile */}
              <div className="mt-6">
                <details className="group">
                  <summary className="flex items-center justify-between px-3 py-2 rounded-md cursor-pointer select-none text-gray-700 hover:bg-pink-50/50 hover:text-[#eb1c75] font-medium transition-all duration-200">
                    <span className="flex items-center gap-2">
                      Categories
                      <ChevronDown className="ml-1 h-4 w-4 group-open:rotate-180 transition-transform duration-200" />
                    </span>
                  </summary>
                  <div className="pl-2 pt-2 space-y-1">
                    {categories.map((category) => (
                      <div key={category.id} className="space-y-1">
                        <details className="group/subcategory">
                          <summary className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-md w-full transition-all duration-200 cursor-pointer",
                            isCategoryActive(category.id)
                              ? "bg-pink-50 text-[#eb1c75] font-medium shadow-sm" 
                              : "text-gray-700 hover:bg-pink-50/50 hover:text-[#eb1c75] hover:shadow-sm"
                          )}>
                            <div className="flex items-center gap-3">
                              {category.image && (
                                <div className="w-6 h-6 rounded-md overflow-hidden flex-shrink-0 shadow-sm">
                                  <Image
                                    src={optimizeCloudinary(category.image)}
                                    alt={category.name}
                                    width={24}
                                    height={24}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <span>{category.name}</span>
                            </div>
                            {category.subcategories?.length > 0 && (
                              <ChevronDown className="h-4 w-4 text-gray-400 transition-transform duration-200 group-open/subcategory:rotate-180" />
                            )}
                          </summary>
                          
                          {category.subcategories?.length > 0 && (
                            <div className="pl-4 pt-1 space-y-1">
                              {category.subcategories.map((subcategory) => (
                                <Link 
                                  key={subcategory.id}
                                  href={`/category/${category.id}/${subcategory.id}`}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-md w-full transition-all duration-200",
                                    pathname.includes(`/category/${category.id}/${subcategory.id}`)
                                      ? "bg-pink-50/70 text-[#eb1c75] font-medium shadow-sm" 
                                      : "text-gray-600 hover:bg-pink-50/30 hover:text-[#eb1c75] hover:shadow-sm"
                                  )}
                                  onClick={() => setIsMenuOpen(false)}
                                >
                                  {subcategory.image && (
                                    <div className="w-5 h-5 rounded-md overflow-hidden flex-shrink-0 shadow-sm">
                                      <Image
                                        src={optimizeCloudinary(subcategory.image)}
                                        alt={subcategory.name}
                                        width={20}
                                        height={20}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  )}
                                  <span className="text-sm">{subcategory.name}</span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </details>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
              {/* End Categories Dropdown for Mobile */}

              {/* About us and Contact links without 'More' heading */}
              <Link
                href="/about"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md w-full transition-all duration-200",
                  isLinkActive('/about')
                    ? "bg-pink-50 text-[#eb1c75] font-medium shadow-sm"
                    : "text-gray-700 hover:bg-pink-50/50 hover:text-[#eb1c75] hover:shadow-sm hover:-translate-x-0.5"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                About us
              </Link>
              <Link
                href="/contact"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md w-full transition-all duration-200",
                  isLinkActive('/contact')
                    ? "bg-pink-50 text-[#eb1c75] font-medium shadow-sm"
                    : "text-gray-700 hover:bg-pink-50/50 hover:text-[#eb1c75] hover:shadow-sm hover:-translate-x-0.5"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
            </div>
          </nav>

          {/* Footer */}
          {isAuthenticated && (
            <div className="p-4 border-t bg-gray-50/50">
              <Button 
                variant="ghost" 
                className="w-full text-gray-700 hover:text-[#eb1c75] hover:bg-pink-50 transition-all hover:shadow-sm"
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Navbar
