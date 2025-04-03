'use client';

import { Facebook, Instagram } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Logo from '../../images/Logo.png';

const Footer = () => {
  const router = useRouter();
  const [year, setYear] = useState('');
 
  useEffect(() => {
    setYear(new Date().getFullYear().toString());
  }, []);

  return (
      <footer className="bg-black text-white py-6 mt-auto">
      <div className="container mx-auto grid grid-cols-1 min-[835px]:grid-cols-3 gap-8 px-4 md:px-8">
      <div className='text-center min-[835px]:text-left'>
        <p className='font-bold text-lg'>The Grocery Mart</p>
        <a className='text-sm hover:underline' onClick={() => router.push('/about-us')}>About Us</a><br />
        <a className='text-sm hover:underline' onClick={() => router.push('/privacy-policy')}>Privacy Policy</a><br />
        <a className='text-sm hover:underline' onClick={() => router.push('/terms-and-conditions')}>Terms and Conditions</a>
      </div>
      <div className="text-center min-[835px]:text-left">
        <p className='font-bold text-lg'>Help</p>
        <a className='text-sm hover:underline' onClick={() => router.push('/FAQS')}>FAQs</a><br />
        <a className='text-sm hover:underline' onClick={() => router.push('/contact-us')}>Contact Us</a>
      </div>
      <div className='flex justify-center min-[835px]:justify-start'>
        <div>
          <p className="font-bold text-lg mb-2 justify-between flex">Follow Us</p>
          <div className='flex space-x-4'>
            <a onClick={() => router.push('https://www.facebook.com')}><Facebook /></a>
            <a className='' onClick={() => router.push('')}><Instagram /></a>
          </div>
        </div>
        <div className="-mt-2 ml-5">
          <Link href={'/'} className="flex items-center">
            {/* <svg viewBox="0 0 151.5 154.5" preserveAspectRatio="xMidYMid meet" className="w-12 h-12">
              <g>
                <path
                  fillOpacity="1"
                  fill="black"
                  d="M 35.5,-0.5 C 62.1667,-0.5 88.8333,-0.5 115.5,-0.5C 135.833,3.16667 147.833,15.1667 151.5,35.5C 151.5,63.1667 151.5,90.8333 151.5,118.5C 147.833,138.833 135.833,150.833 115.5,154.5C 88.8333,154.5 62.1667,154.5 35.5,154.5C 15.1667,150.833 3.16667,138.833 -0.5,118.5C -0.5,90.8333 -0.5,63.1667 -0.5,35.5C 3.16667,15.1667 15.1667,3.16667 35.5,-0.5 Z"
                ></path>
              </g>
              <g>
                <path
                  fillOpacity="0.93"
                  fill="green"
                  d="M 41.5,40.5 C 45.8333,40.5 50.1667,40.5 54.5,40.5C 57.0108,51.5431 59.6775,62.5431 62.5,73.5C 74.1667,73.5 85.8333,73.5 97.5,73.5C 99.4916,67.1906 101.492,60.8573 103.5,54.5C 91.8476,53.6675 80.1809,53.1675 68.5,53C 65.8333,51 65.8333,49 68.5,47C 82.1667,46.3333 95.8333,46.3333 109.5,47C 110.578,47.6739 111.245,48.6739 111.5,50C 108.806,60.4206 105.139,70.4206 100.5,80C 88.8381,80.4999 77.1714,80.6665 65.5,80.5C 65.2865,82.1439 65.6198,83.6439 66.5,85C 78.5,85.3333 90.5,85.6667 102.5,86C 111.682,90.8783 113.516,97.7117 108,106.5C 99.0696,112.956 92.0696,111.289 87,101.5C 86.2716,98.7695 86.4383,96.1029 87.5,93.5C 83.2047,92.3391 78.8713,92.1725 74.5,93C 77.4896,99.702 75.8229,105.035 69.5,109C 59.4558,111.977 53.4558,108.31 51.5,98C 51.8236,93.517 53.8236,90.017 57.5,87.5C 58.6309,85.9255 58.7975,84.2588 58,82.5C 55,71.1667 52,59.8333 49,48.5C 46.2037,47.7887 43.3704,47.122 40.5,46.5C 39.2291,44.1937 39.5624,42.1937 41.5,40.5 Z"
                ></path>
              </g>
            </svg> */}
            <div className="flex items-center">
              <Image
                src={Logo}
                  alt="Logo"
                  // layout="responsive"
                  // width={10}
                  // height={10}
                  className="w-10 h-10 shadow-black/50 transition-transform duration-300"
              />
            </div>
            <h6 className="text-xl font-bold ml-1">Gr<span className="text-green-700">ocer</span>y Mart</h6>
            </Link>
          </div> 
        </div>
      </div>
      <p className="text-center text-xs mt-12 md:text-sm">&copy; {year} Grocery Mart. All rights reserved.</p>
      </footer>
  );
};

export default Footer;