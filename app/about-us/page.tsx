'use client';

import React from 'react';

const AboutUs = () => {
  return (
    <div>AboutUs</div>
  )
}

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
