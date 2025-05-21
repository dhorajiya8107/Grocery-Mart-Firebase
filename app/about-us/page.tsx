'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ShoppingBag, Smartphone, Truck } from 'lucide-react';
import Image from 'next/image';
import bannerImage from "../../images/Home/Homepage2.png";
import bannerImage1 from "../../images/Home/Homepage1.png";

const AboutUs = () => {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const toggleSection = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const sections = [
    {
      id: 1,
      title: "Instant delivery service in India",
      content: "Shop on the go and get anything delivered in minutes. Buy everything from groceries to fresh fruits & vegetables, cakes and bakery items, cosmetics, and much more. We get it delivered at your doorstep in the fastest and the safest way possible.",
      icon: <Truck className="w-6 h-6" />,
      color: "from-green-600 to-green-700"
    },
    {
      id: 2,
      title: "Single app for all your daily needs",
      content: "Order thousands of products at just a tap - milk, bread, cooking oil, ghee, atta, rice, fresh fruits & vegetables, spices, chocolates, chips, biscuits, noodles, cold drinks, shampoos, soaps, body wash, pet food, diapers, electronics, other organic and gourmet products from your neighbourhood stores and a lot more.",
      icon: <Smartphone className="w-6 h-6" />,
      color: "from-orange-400 to-orange-600"
    },
    {
      id: 3,
      title: "Order online on Grocery Mart to enjoy instant delivery magic",
      content: "Cities we currently serve: several cities",
      icon: <ShoppingBag className="w-6 h-6" />,
      color: "from-purple-500 to-purple-700"
    }
  ];

  return (
    <div className="relative overflow-hidden bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-green-100 to-green-200 rounded-full opacity-30 blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full opacity-30 blur-3xl"></div>
      
      <div className="relative mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            About Grocery Mart
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            Your one-stop solution for all grocery needs with lightning-fast delivery
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
          <div className="relative h-64 md:h-full rounded-2xl overflow-hidden shadow-xl">
            <Image 
              src={bannerImage} 
              alt="Grocery delivery" 
              width={600} 
              height={400}
              className="object-cover w-full h-full"
            />
          </div>
          
          <div className="space-y-6">
            {sections.map((section, index) => (
              <div key={section.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleSection(index)}
                  className="w-full flex items-center justify-between p-5 text-left focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r ${section.color} text-white`}>
                      {section.icon}
                    </div>
                    <span className="font-bold text-gray-800">{section.title}</span>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${activeIndex === index ? 'transform rotate-180' : ''}`} 
                  />
                </button>
                
                <AnimatePresence>
                  {activeIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 pt-0 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                        <p className="text-gray-600">{section.content}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8 shadow-inner">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-green-100 text-green-600 rounded-full">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Get your groceries delivered in minutes, not hours</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-amber-100 text-amber-600 rounded-full">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Wide Selection</h3>
              <p className="text-gray-600">Thousands of products from local stores</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Easy Ordering</h3>
              <p className="text-gray-600">Simple app interface for hassle-free shopping</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;




{/* Product Image */}
                // <div className={`relative flex justify-center items-center p-8 ${isOutOfStock ? 'bg-white opacity-50' : 'bg-white'}`}>
                //   {isOutOfStock && (
                //     <div className="absolute flex items-center">
                //       <span className="text-white bg-black text-sm rounded-xl font-bold p-2">Out of Stock</span>
                //     </div>
                //   )}
                //   <img
                //     src={product.imageUrl}
                //     alt={product.productName}
                //     className="w-100 h-auto max-[768px]:ws-120 object-contain rounded-md max-[768px]:-mt-6"
                //   />

                //   <div className="flex flex-col">
                //     //</div><div className="w-full mb-4">
                //       <Image
                //         src={images[activeIndex]}
                //         alt={`${product.productName}`}
                //         className="w-full h-80 object-contain rounded-md"
                //         width={400}
                //         height={400}
                //       />
                //     </div>
      
                //    // {images.length !== 1 && (
                //       <div className="flex overflow-x-auto gap-2 w-full py-2">
                //       {images.map((image, index) => (
                //         <div 
                //           key={index}
                //           className={`cursor-pointer min-w-16 h-16 border-2 rounded-md ${
                //             activeIndex === index ? 'border-green-700' : 'border-gray-200'
                //           }`}
                //           onClick={() => setActiveIndex(index)}
                //         >
                //           <Image
                //             src={image}
                //             alt={`${product.productName} ${index > 0 ? index : ''}`}
                //             className="w-full h-full object-contain rounded-md"
                //             width={60}
                //             height={60}
                //           />
                //         </div>
                //       ))}
                //     </div>
                //     )}

                //     <div className="w-80 mb-4">
                //     //    <img
                //           src={productImages[activeIndex] || product.imageUrl}
                //           alt={`${product.productName}`}
                //           className="w-full h-80 object-contain rounded-md"
                //         />
                //         <Swiper
                //           modules={[Autoplay, Navigation, Parallax]}
                //           spaceBetween={0}
                //           slidesPerView={1}
                //           // autoplay={{ delay: 5000, disableOnInteraction: false }}
                //           className="w-full rounded-md"
                //           onSwiper={(swiper) => (swiperRef.current = swiper)}
                //           onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
                //         >
                //           {productImages.map((image, index) => (
                //             <SwiperSlide key={index}>
                //               <div
                //                 className={`cursor-pointer w-full rounded-md`}
                //                 onClick={() => setActiveIndex(index)}
                //               >
                //                 <img
                //                   src={image || "/placeholder.svg"}
                //                   alt={`${product.productName} ${index > 0 ? index : ""}`}
                //                   className="w-full h-80 object-contain rounded-md"
                //                 />
                //               </div>
                //             </SwiperSlide>
                //           ))}
                //         </Swiper>
                //       </div>

                //       {productImages.length > 1 && (
                //         <div className="flex overflow-x-auto gap-2 w-full py-2">
                //           {productImages.map((image, index) => (
                //             <div
                //               key={index}
                //               className={`cursor-pointer min-w-16 h-16 border-2 rounded-md ${
                //                 activeIndex === index ? "border-green-700" : "border-gray-200"
                //               }`}
                //               // onClick={() => setActiveIndex(index)}
                //               onClick={() => { swiperRef.current?.slideTo(index) }}
                //             >
                //               <img
                //                 src={image || "/placeholder.svg"}
                //                 alt={`${product.productName} ${index > 0 ? index : ""}`}
                //                 className="w-full h-full object-contain rounded-md"
                //                 width={60}
                //                 height={60}
                //               />
                //             </div>
                //           ))}
                //         </div>
                //       )}
                //   </div>
