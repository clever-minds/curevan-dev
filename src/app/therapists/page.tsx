import { getTherapyCategoriesWithIds } from "@/lib/repos/categories";
import { fetchPublicProducts } from "@/lib/repos/products";
import { listTherapists } from "@/lib/repos/therapists";
import TherapyClientPage from "./TherapyClientPage";
import Image from "next/image";
import Link from "next/link";
import { Activity, Star, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ServicesDirectoryPage() {
  const [categories, products, therapists] = await Promise.all([
    getTherapyCategoriesWithIds(),
    fetchPublicProducts(),
    listTherapists()
  ]);

  return (
    <>
      <TherapyClientPage 
        initialCategories={categories || []} 
        initialProducts={products || []}
        initialTherapists={therapists || []}
      />
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
    </>
  );
}
