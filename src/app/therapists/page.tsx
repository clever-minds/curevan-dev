import Link from "next/link";
import Image from "next/image";
import { ChevronRight, CheckCircle2, Activity, UserPlus, Star, ArrowRight } from "lucide-react";
import { FaWalking, FaBed, FaBrain, FaLungs, FaBaby, FaWheelchair, FaUserNurse, FaComments, FaBriefcaseMedical, FaStethoscope } from 'react-icons/fa';
import { Button } from "@/components/ui/button";
import { getTherapyCategoriesWithIds } from "@/lib/repos/categories";
import { fetchPublicProducts } from "@/lib/repos/products";
import { imageUrl } from "@/lib/image";
import ProductCard from "@/components/product-card";

function getServiceStyle(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("physio")) return { icon: FaWalking, color: "text-[#3b82f6]", bg: "bg-[#eff6ff]", borderTop: "border-t-[#3b82f6]/50", borderColor: "border-[#eff6ff]", shortName: "Physiotherapy", desc: "Pain, mobility & recovery" };
  if (normalized.includes("post-surgery") || normalized.includes("surgery")) return { icon: FaBed, color: "text-[#22c55e]", bg: "bg-[#f0fdf4]", borderTop: "border-t-[#22c55e]/50", borderColor: "border-[#f0fdf4]", shortName: "Post-Surgery Rehab", desc: "Guided recovery support" };
  if (normalized.includes("neuro")) return { icon: FaBrain, color: "text-[#8b5cf6]", bg: "bg-[#f5f3ff]", borderTop: "border-t-[#8b5cf6]/50", borderColor: "border-[#f5f3ff]", shortName: "Neuro Rehab", desc: "Stroke, balance & nerve care" };
  if (normalized.includes("respiratory") || normalized.includes("lung")) return { icon: FaLungs, color: "text-[#06b6d4]", bg: "bg-[#ecfeff]", borderTop: "border-t-[#06b6d4]/50", borderColor: "border-[#ecfeff]", shortName: "Respiratory Therapy", desc: "Breathing & lung support" };
  if (normalized.includes("postpartum") || normalized.includes("mother")) return { icon: FaBaby, color: "text-[#ec4899]", bg: "bg-[#fdf2f8]", borderTop: "border-t-[#ec4899]/50", borderColor: "border-[#fdf2f8]", shortName: "Postpartum Care", desc: "Mother & baby recovery care" };
  if (normalized.includes("elder") || normalized.includes("senior")) return { icon: FaWheelchair, color: "text-[#eab308]", bg: "bg-[#fefce8]", borderTop: "border-t-[#eab308]/50", borderColor: "border-[#fefce8]", shortName: "Elder Care", desc: "Senior care & assistance" };
  if (normalized.includes("nursing") || normalized.includes("care")) return { icon: FaUserNurse, color: "text-[#8b5cf6]", bg: "bg-[#f5f3ff]", borderTop: "border-t-[#8b5cf6]/50", borderColor: "border-[#f5f3ff]", shortName: "Nursing Care", desc: "Home nursing support" };
  if (normalized.includes("speech")) return { icon: FaComments, color: "text-[#3b82f6]", bg: "bg-[#eff6ff]", borderTop: "border-t-[#3b82f6]/50", borderColor: "border-[#eff6ff]", shortName: "Speech Therapy", desc: "Speech & communication care" };
  if (normalized.includes("occupational")) return { icon: FaBriefcaseMedical, color: "text-[#22c55e]", bg: "bg-[#f0fdf4]", borderTop: "border-t-[#22c55e]/50", borderColor: "border-[#f0fdf4]", shortName: "Occupational Health", desc: "Workplace wellness services" };
  
  return { icon: FaStethoscope, color: "text-[#0d9488]", bg: "bg-[#f0fdfa]", borderTop: "border-t-[#0d9488]/50", borderColor: "border-[#f0fdfa]", shortName: name, desc: "Professional healthcare services" };
}

export default async function ServicesDirectoryPage() {
  const [categories, products] = await Promise.all([
    getTherapyCategoriesWithIds(),
    fetchPublicProducts()
  ]);

  // Take top 4 products for the featured section
  const featuredProducts = products.slice(0, 4);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top Hero Section */}
      <div className="bg-white pt-12 pb-16 border-b border-gray-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left Side */}
            <div className="w-full lg:w-1/2">
              <h1 className="text-4xl lg:text-5xl lg:leading-[1.15] font-extrabold tracking-tight text-[#0f172a] mb-6">
                Expert healthcare, <br/> at your doorstep
              </h1>
              <p className="text-lg text-slate-600 mb-8 max-w-lg leading-relaxed">
                Connect with trusted professionals for personalized in-home healthcare, therapy, and recovery services. We bring the clinic to you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="px-8 rounded-xl text-base shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform">
                  <Link href="#services">Explore Services</Link>
                </Button>
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
      </div>

      {/* New Services Grid Section (The Image Design) */}
      <section id="services" className="py-20 bg-[#f8fafc] relative z-20">
        <div className="container mx-auto px-4 max-w-[1250px]">
          <div className="text-center mb-12">
            <h2 className="text-[32px] md:text-[36px] font-extrabold text-[#0f172a] mb-3 tracking-tight">Our Therapy & Services</h2>
            <p className="text-[15px] text-slate-500 max-w-2xl mx-auto">
              Specialized care tailored to your needs. Choose a service to find the right therapist.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((category: any) => {
              const { icon: Icon, color, bg, borderTop, shortName, desc: fallbackDesc } = getServiceStyle(category.name);
              
              // Use dynamic values from database if available, otherwise use hardcoded fallbacks
              const displayDesc = category.description || fallbackDesc;
              const hasDynamicIcon = !!category.fa_icon;
              
              return (
                <Link 
                  key={category.id || category.name}
                  href={`/therapists/category/${encodeURIComponent(category.name)}`}
                  className={`group relative flex items-start p-9 bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 border-t-[3px] ${borderTop} hover:border-slate-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)] transition-all duration-300 min-h-[200px]`}
                >
                  {/* Icon Box */}
                  <div className={`w-[92px] h-[92px] shrink-0 rounded-[22px] flex items-center justify-center ${bg} ${color} transition-transform group-hover:scale-[1.05] mr-7`}>
                    {category.icon_path ? (
                      <img src={imageUrl(category.icon_path)} alt={shortName} className="w-[48px] h-[48px] object-contain" />
                    ) : hasDynamicIcon ? (
                      <i className={`${category.fa_icon} text-[42px]`}></i>
                    ) : (
                      <Icon className="w-[42px] h-[42px]" />
                    )}
                  </div>
                  
                  {/* Text Content */}
                  <div className="flex-1 min-w-0 pr-12 pt-3">
                    <h3 className="text-[22px] font-bold text-[#0f172a] mb-2.5 leading-tight">{shortName}</h3>
                    <p className="text-[16px] text-slate-500 leading-relaxed">{displayDesc}</p>
                  </div>
                  
                  {/* Arrow Button */}
                  <div className={`absolute bottom-7 right-7 w-[40px] h-[40px] rounded-full flex items-center justify-center ${bg} ${color} group-hover:bg-primary group-hover:text-white transition-colors`}>
                    <ChevronRight className="w-[22px] h-[22px] ml-[2px]" strokeWidth={3} />
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-12 flex items-center justify-center gap-2 text-[13px] text-slate-500 font-medium">
            <CheckCircle2 className="text-[#22c55e] w-[18px] h-[18px]" strokeWidth={2.5} />
            <span>Trusted care. Professional therapists. Better recovery.</span>
          </div>
        </div>
      </section>

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
