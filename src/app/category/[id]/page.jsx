import CategoryPageComponent from "@/components/Category/category-page"
import Footer from "@/components/Webpage/Footer/Footer"
import Navbar from "@/components/Webpage/Navbar/Navbar"
// import { notFound } from "next/navigation"

// This is a mock database of categories and their subcategories
const categories = [
  {
    id: "ethnic-wear",
    name: "Ethnic Wear",
    image: "/images/categories/ethnic-wear.png",
    description: "Traditional clothing with cultural heritage",
    banner: "/images/banners/ethnic-wear-banner.jpg",
    subcategories: [
      { id: "sarees", name: "Sarees", image: "/placeholder.svg?height=200&width=200&text=Sarees" },
      { id: "kurtas", name: "Kurtas & Kurtis", image: "/placeholder.svg?height=200&width=200&text=Kurtas" },
      { id: "lehengas", name: "Lehengas", image: "/placeholder.svg?height=200&width=200&text=Lehengas" },
      { id: "ethnic-sets", name: "Ethnic Sets", image: "/placeholder.svg?height=200&width=200&text=Ethnic Sets" },
      {
        id: "ethnic-bottoms",
        name: "Ethnic Bottoms",
        image: "/placeholder.svg?height=200&width=200&text=Ethnic Bottoms",
      },
      { id: "blouses", name: "Blouses", image: "/placeholder.svg?height=200&width=200&text=Blouses" },
      { id: "dupattas", name: "Dupattas", image: "/placeholder.svg?height=200&width=200&text=Dupattas" },
      { id: "ethnic-gowns", name: "Ethnic Gowns", image: "/placeholder.svg?height=200&width=200&text=Ethnic Gowns" },
    ],
  },
  {
    id: "western-dresses",
    name: "Western Dresses",
    image: "/images/categories/western-dresses.png",
    description: "Modern and stylish western fashion",
    banner: "/images/banners/western-dresses-banner.jpg",
    subcategories: [
      {
        id: "casual-dresses",
        name: "Casual Dresses",
        image: "/placeholder.svg?height=200&width=200&text=Casual Dresses",
      },
      {
        id: "formal-dresses",
        name: "Formal Dresses",
        image: "/placeholder.svg?height=200&width=200&text=Formal Dresses",
      },
      { id: "maxi-dresses", name: "Maxi Dresses", image: "/placeholder.svg?height=200&width=200&text=Maxi Dresses" },
      { id: "mini-dresses", name: "Mini Dresses", image: "/placeholder.svg?height=200&width=200&text=Mini Dresses" },
      { id: "party-dresses", name: "Party Dresses", image: "/placeholder.svg?height=200&width=200&text=Party Dresses" },
      { id: "bodycon-dresses", name: "Bodycon Dresses", image: "/placeholder.svg?height=200&width=200&text=Bodycon" },
    ],
  },
  {
    id: "menswear",
    name: "Menswear",
    image: "/images/categories/menswear.png",
    description: "Clothing designed for men of all ages",
    banner: "/images/banners/menswear-banner.jpg",
    subcategories: [
      { id: "shirts", name: "Shirts", image: "/placeholder.svg?height=200&width=200&text=Shirts" },
      { id: "t-shirts", name: "T-Shirts", image: "/placeholder.svg?height=200&width=200&text=T-Shirts" },
      { id: "jeans", name: "Jeans", image: "/placeholder.svg?height=200&width=200&text=Jeans" },
      { id: "trousers", name: "Trousers", image: "/placeholder.svg?height=200&width=200&text=Trousers" },
      { id: "suits", name: "Suits", image: "/placeholder.svg?height=200&width=200&text=Suits" },
      { id: "ethnic-wear-men", name: "Ethnic Wear", image: "/placeholder.svg?height=200&width=200&text=Ethnic Wear" },
      { id: "activewear-men", name: "Activewear", image: "/placeholder.svg?height=200&width=200&text=Activewear" },
    ],
  },
  {
    id: "footwear",
    name: "Footwear",
    image: "/images/categories/footwear.png",
    description: "Shoes and sandals for every occasion",
    banner: "/images/banners/footwear-banner.jpg",
    subcategories: [
      { id: "casual-shoes", name: "Casual Shoes", image: "/placeholder.svg?height=200&width=200&text=Casual Shoes" },
      { id: "formal-shoes", name: "Formal Shoes", image: "/placeholder.svg?height=200&width=200&text=Formal Shoes" },
      { id: "sports-shoes", name: "Sports Shoes", image: "/placeholder.svg?height=200&width=200&text=Sports Shoes" },
      { id: "sandals", name: "Sandals", image: "/placeholder.svg?height=200&width=200&text=Sandals" },
      { id: "heels", name: "Heels", image: "/placeholder.svg?height=200&width=200&text=Heels" },
      { id: "flats", name: "Flats", image: "/placeholder.svg?height=200&width=200&text=Flats" },
      { id: "boots", name: "Boots", image: "/placeholder.svg?height=200&width=200&text=Boots" },
    ],
  },
  {
    id: "home-decor",
    name: "Home Decor",
    image: "/images/categories/home-decor.png",
    description: "Beautiful items to decorate your home",
    banner: "/images/banners/home-decor-banner.jpg",
    subcategories: [
      { id: "bedding", name: "Bedding", image: "/placeholder.svg?height=200&width=200&text=Bedding" },
      { id: "curtains", name: "Curtains", image: "/placeholder.svg?height=200&width=200&text=Curtains" },
      { id: "cushions", name: "Cushions", image: "/placeholder.svg?height=200&width=200&text=Cushions" },
      { id: "wall-decor", name: "Wall Decor", image: "/placeholder.svg?height=200&width=200&text=Wall Decor" },
      { id: "lamps", name: "Lamps", image: "/placeholder.svg?height=200&width=200&text=Lamps" },
      { id: "vases", name: "Vases", image: "/placeholder.svg?height=200&width=200&text=Vases" },
    ],
  },
  {
    id: "beauty",
    name: "Beauty",
    image: "/images/categories/beauty.png",
    description: "Cosmetics and beauty products",
    banner: "/images/banners/beauty-banner.jpg",
    subcategories: [
      { id: "makeup", name: "Makeup", image: "/placeholder.svg?height=200&width=200&text=Makeup" },
      { id: "skincare", name: "Skincare", image: "/placeholder.svg?height=200&width=200&text=Skincare" },
      { id: "haircare", name: "Haircare", image: "/placeholder.svg?height=200&width=200&text=Haircare" },
      { id: "fragrances", name: "Fragrances", image: "/placeholder.svg?height=200&width=200&text=Fragrances" },
      { id: "bath-body", name: "Bath & Body", image: "/placeholder.svg?height=200&width=200&text=Bath & Body" },
    ],
  },
  {
    id: "accessories",
    name: "Accessories",
    image: "/images/categories/accessories.png",
    description: "Bags, jewelry, and other accessories",
    banner: "/images/banners/accessories-banner.jpg",
    subcategories: [
      { id: "bags", name: "Bags", image: "/placeholder.svg?height=200&width=200&text=Bags" },
      { id: "jewelry", name: "Jewelry", image: "/placeholder.svg?height=200&width=200&text=Jewelry" },
      { id: "watches", name: "Watches", image: "/placeholder.svg?height=200&width=200&text=Watches" },
      { id: "sunglasses", name: "Sunglasses", image: "/placeholder.svg?height=200&width=200&text=Sunglasses" },
      { id: "belts", name: "Belts", image: "/placeholder.svg?height=200&width=200&text=Belts" },
      { id: "scarves", name: "Scarves", image: "/placeholder.svg?height=200&width=200&text=Scarves" },
    ],
  },
  {
    id: "grocery",
    name: "Grocery",
    image: "/images/categories/grocery.png",
    description: "Fresh and packaged food items",
    banner: "/images/banners/grocery-banner.jpg",
    subcategories: [
      {
        id: "fruits-vegetables",
        name: "Fruits & Vegetables",
        image: "/placeholder.svg?height=200&width=200&text=Fruits & Vegetables",
      },
      { id: "dairy", name: "Dairy", image: "/placeholder.svg?height=200&width=200&text=Dairy" },
      { id: "bakery", name: "Bakery", image: "/placeholder.svg?height=200&width=200&text=Bakery" },
      { id: "snacks", name: "Snacks", image: "/placeholder.svg?height=200&width=200&text=Snacks" },
      { id: "beverages", name: "Beverages", image: "/placeholder.svg?height=200&width=200&text=Beverages" },
      { id: "household", name: "Household", image: "/placeholder.svg?height=200&width=200&text=Household" },
    ],
  },
]

export default function CategoryPage({ params }) {
  const category = categories.find((cat) => cat.id === params.id)

  // if (!category) {
  //   notFound()
  // }

  return(
  <>
    <Navbar />
   <CategoryPageComponent categoryId={params.id} />
   <Footer />
 </>
  )
}