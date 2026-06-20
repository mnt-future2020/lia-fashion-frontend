export const dashboardData = {
  kpiData: {
    currentMonth: {
      revenue: 7825,
      revenueGrowth: 22,
      orders: 920,
      ordersGrowth: -25,
      newUsers: 12000,
      newUsersGrowth: 19,
      existingUsers: 3500,
      existingUsersGrowth: 19
    }
  },

  revenueData: Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2025, i, 1).toLocaleString('default', { month: 'short' }),
    revenue: Math.floor(Math.random() * (400000 - 200000) + 200000),
    orders: Math.floor(Math.random() * (1500 - 500) + 500)
  })),

  topProducts: [
    {
      id: 1,
      name: "Men Grey Hoodie",
      image: "/products/hoodie.jpg",
      price: 49.90,
      unitsSold: 204
    },
    {
      id: 2,
      name: "Women Striped T-Shirt",
      image: "/products/striped-tshirt.jpg",
      price: 34.90,
      unitsSold: 155
    },
    {
      id: 3,
      name: "Women White T-Shirt",
      image: "/products/white-tshirt.jpg",
      price: 40.90,
      unitsSold: 120
    },
    {
      id: 4,
      name: "Men White T-Shirt",
      image: "/products/men-white-tshirt.jpg",
      price: 49.90,
      unitsSold: 204
    },
    {
      id: 5,
      name: "Women Red T-Shirt",
      image: "/products/red-tshirt.jpg",
      price: 34.90,
      unitsSold: 155
    }
  ],

  topCategories: [
    {
      id: 1,
      name: "T-Shirts",
      image: "/categories/tshirts.jpg",
      price: 25000, // Changed from revenue to price
      unitsSold: 850
    },
    {
      id: 2,
      name: "Hoodies",
      image: "/categories/hoodies.jpg",
      price: 18000, // Changed from revenue to price
      unitsSold: 420
    },
    {
      id: 3,
      name: "Jeans",
      image: "/categories/jeans.jpg",
      price: 15000, // Changed from revenue to price
      unitsSold: 380
    },
    {
      id: 4,
      name: "Shoes",
      image: "/categories/shoes.jpg",
      price: 12000, // Changed from revenue to price
      unitsSold: 250
    },
    {
      id: 5,
      name: "Accessories",
      image: "/categories/accessories.jpg",
      price: 8000, // Changed from revenue to price
      unitsSold: 180
    }
  ],

  lowStockProducts: [
    {
      id: 1,
      name: "Deco accessory",
      category: "Accessories",
      price: 21.19,
      quantity: 12,
      status: "Low Stock"
    },
    {
      id: 2,
      name: "Pottery Vase",
      category: "Home Decor",
      price: 14.18,
      quantity: 4,
      status: "Out of Stock"
    },
    {
      id: 3,
      name: "Rose Holdback",
      category: "Accessories",
      price: 18.15,
      quantity: 10,
      status: "Low Stock"
    },
    {
      id: 4,
      name: "Flowering Cactus",
      category: "Plants",
      price: 74.16,
      quantity: 21,
      status: "Low Stock"
    }
  ],

  recentTransactions: [
    {
      id: 1,
      customerName: "Jagarnath S.",
      date: "24.05.2023",
      amount: 124.97,
      status: "Paid"
    },
    {
      id: 2,
      customerName: "Anand G.",
      date: "23.05.2023",
      amount: 55.42,
      status: "Paid"
    },
    {
      id: 3,
      customerName: "Kartik S.",
      date: "23.05.2023",
      amount: 89.90,
      status: "Paid"
    },
    {
      id: 4,
      customerName: "Rakesh S.",
      date: "22.05.2023",
      amount: 144.94,
      status: "Paid"
    },
    {
      id: 5,
      customerName: "Anup S.",
      date: "22.05.2023",
      amount: 70.52,
      status: "Paid"
    }
  ]
}