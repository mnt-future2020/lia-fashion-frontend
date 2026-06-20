"use client"

import { useState, useEffect } from "react"
import {
  IconLayoutDashboard,
  IconUsers,
  IconSettings,
  IconChevronDown,
  IconChevronRight,
  IconMenu2,
  IconX,
  IconTruckDelivery,
  IconStackFront,
  IconCategory,
  IconTicket,
  IconBuildingWarehouse,
  IconUsersGroup,
  IconCashRegister,
  IconGift,IconUserStar,
} from "@tabler/icons-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { UserStar } from 'lucide-react';
export default function SideBar() {
  const [activeItem, setActiveItem] = useState("Dashboard")
  const [activeSubItem, setActiveSubItem] = useState("Overview")
  const [expanded, setExpanded] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const [openDropdowns, setOpenDropdowns] = useState({
    Dashboard: false,
    Profile: false,
    Settings: false,
  })

  // Add useEffect to handle window sizing
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 1024) // Changed from 768 to 1024 to include tablets
    }

    // Set initial value
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => window.removeEventListener("resize", handleResize)
  }, [])
  
  // Load active item from localStorage on component mount
  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window !== 'undefined') {
      const savedActiveItem = localStorage.getItem('active_sidebar_item');
      if (savedActiveItem) {
        setActiveItem(savedActiveItem);
      }
    }
  }, []);

  const toggleDropdown = (label) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [label]: !prev[label],
    }))
  }

  const links = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: <IconLayoutDashboard className="h-6 w-6 shrink-0" />,
    },
    {
      label: "Orders",
      href: "/admin/dashboard/orders",
      icon: <IconTruckDelivery className="h-6 w-6 shrink-0" />,
    },
    {
      label: "Products",
      href: "/admin/dashboard/products",
      icon: <IconStackFront className="h-6 w-6 shrink-0" />,
    },
    {
      label: "Categories",
      href: "/admin/dashboard/category",
      icon: <IconCategory className="h-6 w-6 shrink-0" />,
    },
    {
      label: "Contact",
      href: "/admin/dashboard/contact",
      subItems: [
        { 
          label: "Customer", 
          href: "/admin/dashboard/contact/customer",
          className: "data-[state=active]:text-[#eb1c75] data-[state=active]:bg-transparent"
        },
        { 
          label: "Vendor", 
          href: "/admin/dashboard/contact/vendors",
          className: "data-[state=active]:text-[#eb1c75] data-[state=active]:bg-transparent"
        },
      ],
      icon: <IconUsers className="h-6 w-6 shrink-0" />,
    },
    {
      label: "Coupon Code",
      href: "/admin/dashboard/coupons",
      icon: <IconTicket className="h-6 w-6 shrink-0" />,
    },
    {
      label: "Review management",
      href: "/admin/dashboard/reviews",
      icon: <IconUsersGroup className="h-6 w-6 shrink-0" />,
    },
    {
      label: "Site reviews",
      href: "/admin/dashboard/site-reviews",
      icon: <IconUserStar className="h-6 w-6 shrink-0" />,
    },
    {
      label: "Payment History",
      href: "/admin/dashboard/transaction",
      icon: <IconCashRegister className="h-6 w-6 shrink-0" />,
    },
    {
      label: "Offers",
      href: "/admin/dashboard/offers",
      icon: <IconGift className="h-6 w-6 shrink-0" />,
    },
    {
      label: "Promo Popups",
      href: "/admin/dashboard/promo-popups",
      icon: <IconTicket className="h-6 w-6 shrink-0" />,
    },
  
    {
      label: "POS",
      href: "/admin/dashboard/pos",
      icon: <IconBuildingWarehouse className="h-6 w-6 shrink-0" />,
    },
    {
      label: "Settings",
      href: "/admin/dashboard/settings",
      icon: <IconSettings className="h-6 w-6 shrink-0" />,
    },
  ]

  // Handle mobile menu toggle
  const toggleMobileMenu = () => {
    setMobileOpen(!mobileOpen)
  }

  return (
    <>
      {/* Mobile/Tablet menu button - visible on small and medium screens */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden bg-[#eb1c75] text-white p-2 rounded-md shadow-md hover:bg-[#001a45] transition-colors"
        onClick={toggleMobileMenu}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        {mobileOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
      </button>

      <div
        className={cn(
          "mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 bg-gray-100 lg:flex-row",
          "h-screen",
        )}
      >
        {/* Mobile/Tablet overlay */}
        <AnimatePresence>
          {mobileOpen && isSmallScreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.div
          className={cn(
            "h-full flex flex-col bg-white z-40",
            "fixed lg:relative",
            mobileOpen || !isSmallScreen ? "left-0" : "-left-full",
          )}
          animate={{
            width: expanded ? "275px" : "80px",
            left: mobileOpen || !isSmallScreen ? 0 : "-100%",
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        >
          <div className="flex flex-col h-full p-4">
            <div className="flex items-center justify-between py-2">
              {expanded ? <Logo /> : <LogoIcon />}

              {/* Close button inside sidebar for mobile/tablet */}
              {isSmallScreen && expanded && (
                <button
                  onClick={toggleMobileMenu}
                  className="lg:hidden text-black hover:text-gray-300 transition-colors"
                  aria-label="Close menu"
                >
                  <IconX size={20} />
                </button>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-2 flex-1 overflow-y-auto">
              {links.map((link, idx) => (
                <div key={idx} className="relative">
                  {link.subItems ? (
                    <div className="w-full">
                      {expanded ? (
                        <button
                          className={cn(
                            "flex w-full items-center justify-start gap-2 py-2 px-3 rounded-md transition-colors",
                            activeItem === link.label
                              ? "bg-[#eb1c75] text-white font-medium"
                              : "text-black hover:bg-[#eb1c75] hover:text-white",
                          )}
                          onClick={() => {
                            setActiveItem(link.label)
                            toggleDropdown(link.label)
                          }}
                        >
                          <span className="flex items-center justify-center">{link.icon}</span>
                          <AnimatePresence>
                            {expanded && (
                              <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                className="text-base group-hover/sidebar:translate-x-1 transition font-medium duration-150 whitespace-pre"
                              >
                                {link.label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                          {expanded && (
                            <motion.div
                              animate={{
                                rotate: openDropdowns[link.label] ? 180 : 0,
                              }}
                              transition={{ duration: 0.2 }}
                              className="ml-auto"
                            >
                              <IconChevronDown className="h-4 w-4 shrink-0" />
                            </motion.div>
                          )}
                        </button>
                      ) : (
                        <Link
                          href="/admin/dashboard/contact/customer"
                          className={cn(
                            "flex w-full items-center justify-start gap-2 py-2 px-3 rounded-md transition-colors",
                            activeItem === link.label
                              ? "bg-[#eb1c75] text-white font-medium"
                              : "text-black hover:bg-[#eb1c75] hover:text-white",
                          )}
                          onClick={() => {
                            setActiveItem(link.label)
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('active_sidebar_item', link.label);
                            }
                            if (isSmallScreen) {
                              setMobileOpen(false)
                            }
                          }}
                        >
                          <span className="flex items-center justify-center">{link.icon}</span>
                        </Link>
                      )}

                      <AnimatePresence>
                        {expanded && openDropdowns[link.label] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="ml-6 mt-1 flex flex-col gap-1 pl-2 overflow-hidden"
                          >
                            {link.subItems.map((subItem, subIdx) => (
                              <Link
                                key={subIdx}
                                href={subItem.href}
                                className={cn(
                                  "flex items-center py-1.5 px-2 text-base rounded-md transition-colors",
                                  activeSubItem === subItem.label && activeItem === link.label
                                  ? "text-[#eb1c75] font-medium"
                                  : "text-black hover:text-[#eb1c75]",
                                )}
                                onClick={() => {
                                  setActiveSubItem(subItem.label)
                                  setActiveItem(link.label)
                                  // Save active item to localStorage
                                  if (typeof window !== 'undefined') {
                                    localStorage.setItem('active_sidebar_item', link.label);
                                  }
                                  if (isSmallScreen) {
                                    setMobileOpen(false)
                                  }
                                }}
                              >
                                <span className="hover:translate-x-1 transition duration-150 font-medium">
                                  {subItem.label}
                                </span>
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link
                      href={link.href}
                      className={cn(
                        "flex w-full items-center justify-start gap-2 py-2 px-3 rounded-md transition-colors",
                        activeItem === link.label
                        ? "bg-[#eb1c75] text-white font-medium"
                        : "text-black hover:bg-[#eb1c75] hover:text-white",
                      )}
                      onClick={() => {
                        setActiveItem(link.label)
                        // Save active item to localStorage
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('active_sidebar_item', link.label);
                        }
                        if (isSmallScreen) {
                          setMobileOpen(false)
                        }
                        // Add auto-collapse for POS link
                        if (link.label === "POS") {
                          setExpanded(false)
                        }
                      }}
                    >
                      <span className="flex items-center justify-center">{link.icon}</span>
                      <AnimatePresence>
                        {expanded && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="text-base group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre font-medium"
                          >
                            {link.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                  )}

                  {/* {activeItem === link.label && (
                    <motion.div
                      layoutId="activeItem"
                      className="absolute left-0 top-0 h-full w-1 bg-[#eb1c75] rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )} */}
                </div>
              ))}
            </div>

            <div className="mt-auto pt-4 border-t border-[#000b20]">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center justify-center w-full py-2 px-3 rounded-md text-black bg-[#eb1c75]/10 transition-colors border border-[#000b20]"
              >
                <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <IconChevronRight className="h-5 w-5 text-black" />
                </motion.div>
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="ml-2 text-sm text-black"
                    >
                     
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}

export const Logo = () => {
  return (
    <Link href="/admin/dashboard" className="relative z-20 flex items-center space-x-2 py-1">
      <img 
        src="/assets/images/logo.png" 
        alt="Lia Logo" 
        width={120}
        height={120}
        className="rounded-full"
      />
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-medium whitespace-pre text-black">
        Lia fashion
      </motion.span>
    </Link>
  )
}

export const LogoIcon = () => {
  return (
    <Link href="/admin/dashboard" className="relative z-20 flex items-center space-x-2 py-1">
      <img 
        src="/assets/images/logo.png" 
        alt="Lia Logo"
        width={120}
        height={120}
        className="rounded-full"
      />
    </Link>
  )
}