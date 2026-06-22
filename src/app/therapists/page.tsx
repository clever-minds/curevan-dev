import Link from "next/link";
import Image from "next/image";
import { Activity, HeartPulse, MessageSquare, Briefcase, Brain, Users, Stethoscope, ArrowRight, UserPlus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTherapyCategoriesWithIds } from "@/lib/repos/categories";
import { fetchPublicProducts } from "@/lib/repos/products";
import { imageUrl } from "@/lib/image";
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
    getTherapyCategoriesWithIds(),
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
                {categories.map((category: any) => {
                  const serviceName = category.name;
                  const { icon: Icon, color, shortName } = getServiceStyle(serviceName);

                  return (
                    <Link 
                      key={category.id || serviceName} 
                      href={`/therapists/category/${encodeURIComponent(serviceName)}`}
                      className="group flex flex-col items-center text-center gap-3 transition-transform duration-200 hover:scale-105"
                    >
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${color} group-hover:shadow-md transition-shadow border border-gray-50 overflow-hidden`}>
                        {category.icon_path ? (
                           <img src={imageUrl(category.icon_path)} alt={shortName} className="w-10 h-10 object-contain" />
                        ) : (
                           <Icon className="w-8 h-8" strokeWidth={1.5} />
                        )}
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

      {/* Join Our Growing Network - Redesigned Section */}
      <section className="py-24 bg-gray-50 border-y border-gray-100 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 z-0 pointer-events-none"></div>

        <div className="container mx-auto px-4 lg:px-8 max-w-7xl relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* Left Image / Visual */}
            <div className="w-full lg:w-1/2 relative">
              <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 border-4 border-white">
                <Image 
                  src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=1160&auto=format&fit=crop" 
                  alt="Healthcare Professionals" 
                  fill 
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-primary/5"></div>
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-white">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className={`w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-sm`}>
                          <Image src={`https://i.pravatar.cc/100?img=${30+i}`} alt="Therapist" width={48} height={48} />
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        {[1,2,3,4,5].map((i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                      </div>
                      <p className="text-sm font-bold text-gray-900">500+ Professionals Joined</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="w-full lg:w-1/2 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-8 tracking-wide uppercase">
                <Activity className="w-4 h-4" />
                <span>Careers at Curevan</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Join Our Growing <span className="text-primary">Network</span>
              </h2>
              
              <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Are you a physiotherapist, nurse, or healthcare professional? Partner with Curevan to earn extra income on your own schedule. We bring the patients to you, so you can focus entirely on providing exceptional care.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button asChild size="lg" className="px-8 py-6 text-lg rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-1">
                  <Link href="/auth/therapist-signup">
                    <UserPlus className="mr-2 w-5 h-5"/>
                    Register as a Therapist
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="px-8 py-6 text-lg rounded-xl bg-white hover:bg-gray-100 border-2 border-gray-200 transition-all hover:-translate-y-1 text-gray-700">
                  <Link href="#contact">
                    Learn More
                  </Link>
                </Button>
              </div>
            </div>
            
          </div>
        </div>
      </section>

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
