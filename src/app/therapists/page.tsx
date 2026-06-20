import Link from "next/link";
import Image from "next/image";
import { Activity, HeartPulse, MessageSquare, Briefcase, Brain, Users, Stethoscope, ArrowRight } from "lucide-react";
import { getTherapyCategories } from "@/lib/repos/categories";
import { fetchPublicProducts } from "@/lib/repos/products";
import ProductCard from "@/components/product-card";

function getServiceStyle(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("physio")) return { icon: Activity, color: "text-blue-600 bg-blue-50", shortName: "Physiotherapy" };
  if (normalized.includes("nursing") || normalized.includes("care")) return { icon: HeartPulse, color: "text-rose-600 bg-rose-50", shortName: "Nursing" };
  if (normalized.includes("speech")) return { icon: MessageSquare, color: "text-purple-600 bg-purple-50", shortName: "Speech Tx" };
  if (normalized.includes("occupational")) return { icon: Briefcase, color: "text-orange-600 bg-orange-50", shortName: "Occupational" };
  if (normalized.includes("behavior") || normalized.includes("mental") || normalized.includes("counseling")) return { icon: Brain, color: "text-emerald-600 bg-emerald-50", shortName: "Behavioral" };
  if (normalized.includes("special") || normalized.includes("education")) return { icon: Users, color: "text-indigo-600 bg-indigo-50", shortName: "Special Ed" };
  
  return { icon: Stethoscope, color: "text-teal-600 bg-teal-50", shortName: name.length > 15 ? name.substring(0, 12) + "..." : name };
}

export default async function ServicesDirectoryPage() {
  const [categories, products] = await Promise.all([
    getTherapyCategories(),
    fetchPublicProducts()
  ]);

  // Take top 4 products for the featured section
  const featuredProducts = products.slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-8 pb-20">
      <div className="container mx-auto px-4 max-w-6xl mb-24">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Left Side: Services Grid & Text */}
          <div className="w-full lg:w-1/2">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-8">
              Expert healthcare, <br/> at your doorstep
            </h1>

            {/* UC Style White Box Container */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6">What are you looking for?</h2>
              
              {/* Small Service Boxes Grid */}
              <div className="grid grid-cols-4 gap-4 md:gap-6">
                {categories.map((serviceName: string) => {
                  const { icon: Icon, color, shortName } = getServiceStyle(serviceName);

                  return (
                    <Link 
                      key={serviceName} 
                      href={`/therapists/category/${encodeURIComponent(serviceName)}`}
                      className="group flex flex-col items-center text-center gap-3 transition-transform duration-200 hover:scale-105"
                    >
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${color} group-hover:shadow-md transition-shadow border border-gray-50`}>
                        <Icon className="w-8 h-8" strokeWidth={1.5} />
                      </div>
                      <span className="text-xs md:text-sm font-semibold text-gray-700 group-hover:text-primary leading-tight">
                        {shortName}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side: 3-Image Collage */}
          <div className="w-full lg:w-1/2 relative h-[400px] md:h-[500px] lg:h-[600px]">
            {/* Main Tall Image (Left) */}
            <div className="absolute left-0 top-[10%] w-[55%] h-[80%] rounded-[2rem] overflow-hidden shadow-2xl z-10 transition-transform duration-500 hover:scale-[1.02]">
              <Image 
                src="https://plus.unsplash.com/premium_photo-1661698465350-dab93e1b2df8?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Healthcare professional assisting patient"
                fill
                className="object-cover"
                priority
              />
            </div>
            {/* Top Right Image */}
            <div className="absolute right-0 top-0 w-[40%] h-[45%] rounded-[2rem] overflow-hidden shadow-xl z-20 transition-transform duration-500 hover:scale-[1.05]">
              <Image 
                src="https://plus.unsplash.com/premium_photo-1661779581951-eb3a2fe942bb?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Therapist consulting"
                fill
                className="object-cover"
              />
            </div>
            {/* Bottom Right Image */}
            <div className="absolute right-0 bottom-0 w-[40%] h-[45%] rounded-[2rem] overflow-hidden shadow-xl z-20 transition-transform duration-500 hover:scale-[1.05]">
              <Image 
                src="https://plus.unsplash.com/premium_photo-1663126777540-6fa2e2e577d0?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Physical therapy session"
                fill
                className="object-cover"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <div className="py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Health & Wellness Products</h2>
                <p className="text-gray-600">Professional-grade medical devices and supplies.</p>
              </div>
              <Link href="/shop" className="hidden sm:flex items-center text-primary font-semibold hover:underline">
                View all products <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link href="/shop" className="inline-flex items-center text-primary font-semibold hover:underline">
                View all products <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
