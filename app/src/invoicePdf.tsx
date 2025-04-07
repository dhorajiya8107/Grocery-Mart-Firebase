'use client';

import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle, useCallback } from "react";
import html2canvas from 'html2canvas-pro';
import jsPDF from "jspdf";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "./firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import Image from 'next/image';
import Logo from '../../images/Logo.png';
import { onAuthStateChanged } from "firebase/auth";
 
interface InvoicePdfProps {
  orderId: string;
  paymentStatus?: string;
  orderPlacedDate: string;
  items: {
    name: string;
    quantity: string;
    price: number;
    imageUrl: string;
  }[];
  discount: number;
  deliveryCharges: string;
  totalPrice: number;
  totalItem: string;
  selectedAddressId: string;
}

type Product = {
  id: string;
  description: string;
  productName: string;
  price: number;
  quantity: number;
  discountedPrice: number;
  imageUrl: string;
};

type Order = {
  selectedAddressId: string;
  orderId: string;
  createdAt: string;
  totalAmount: number;
  paymentStatus?: string;
  products?: Product[];
};

interface Address {
  id: string;
  userId: string;
  defaultAddress: boolean;
  address: string;
  floor: string;
  area: string;
  landmark: string;
  name: string;
  phoneNumber: string;
  addressId: string;
  createdAt: number;
  updatedAt: number;
  addressType: "home" | "work" | "hotel" | "other";
  pinCode: string;
  block: string;
  state: string;
  country: string;
}

export interface InvoicePdfRef {
  generate: () => Promise<void>;
}

const InvoicePdf = forwardRef<InvoicePdfRef, InvoicePdfProps>(
  ({ orderId, paymentStatus, orderPlacedDate, items, discount, deliveryCharges }, ref) => {
    const [invoiceData, setInvoiceData] = useState<InvoicePdfProps | null>(null);
    const invoiceRef = useRef<HTMLDivElement>(null);
    const date = new Date();
    const [address, setAddress] = useState<Address[]>([]);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
      const fetchInvoiceData = async () => {
        if (!orderId) return;
        try {
          const orderDoc = await getDoc(doc(db, "orders", orderId));
          if (orderDoc.exists()) {
            const data = orderDoc.data() as Order;
            const mappedItems =
              data.products?.map((product) => ({
                name: product.productName,
                quantity: product.quantity.toString(),
                price: product.discountedPrice || product.price,
                imageUrl: product.imageUrl,
              })) || [];

            const invoice: InvoicePdfProps = {
              orderId: data.orderId,
              paymentStatus: data.paymentStatus || "Pending",
              orderPlacedDate: new Date(data.createdAt).toLocaleDateString(),
              items: mappedItems,
              discount: data.products?.reduce(
                (sum, product) => sum + ((product.price * product.quantity) - (product.discountedPrice * product.quantity)),
                0
              ) || 0,
              deliveryCharges: data.totalAmount > 500 ? "FREE" : "₹50",
              totalPrice: data.totalAmount,
              totalItem: data.products?.reduce((total, product) => total + Number(product.quantity), 0)?.toString() || '0',
              selectedAddressId: data.selectedAddressId,
            };

            setInvoiceData(invoice);
          }
        } catch (error) {
          console.error("Error fetching invoice data:", error);
        }
      };

      fetchInvoiceData();
    }, [orderId]);

    useEffect(() => {
        // const auth = getAuth();
      
        const subscribeToAddresses = (userId: string) => {
          try {
            const addressRef = collection(db, "addresses");
            const q = query(addressRef, where("userId", "==", userId));
      
            const unsubscribe = onSnapshot(q, (snapshot) => {
              if (!snapshot.empty) {
                const addressesData = snapshot.docs.map((doc) => ({
                  ...(doc.data() as Address),
                  id: doc.id,
                }));
      
                setAddress(addressesData);
              }
            });
      
            return unsubscribe;
          } catch (error) {
            console.error("Error subscribing to addresses:", error);
          }
        };
      
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
          if (user) {
            setUserId(user.uid);
            const unsubscribeAddresses = subscribeToAddresses(user.uid);
      
            return () => unsubscribeAddresses?.();
          }
        });
      
        return () => unsubscribeAuth();
      }, []);

    const downloadInvoice = useCallback(async () => {
      const input = document.getElementById('order-summary');
      if (input) {
        const canvas = await html2canvas(input, { scale: 1.5 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = pdf.internal.pageSize.getWidth() - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        pdf.save(`Order_${invoiceData?.orderId}.pdf`);
      }
    }, [invoiceData?.orderId]);
      

    useImperativeHandle(ref, () => ({
      generate: downloadInvoice,
    }));

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short' ,
        year: '2-digit',
      })
      .replace(',', '').replace(' ', ', ') + `, ${date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }).toUpperCase()}`;
    };

    if (!invoiceData) return <p>Loading invoice...</p>;

    return (
      <div id="order-summary" className="flex justify-center py-10">
        <div
          ref={invoiceRef}
          className="p-6 bg-white rounded-xl shadow-md border border-black w-full"
       >
          <div className="flex justify-between items-start border-b mb-3">
            <div className="flex items-center">
                {/* <svg viewBox="0 0 151.5 154.5" preserveAspectRatio="xMidYMid meet" className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex-shrink-0">
                  <g>
                    <path
                      fillOpacity="1"
                      fill="white"
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
            <Image
              src={Logo}
              alt="Logo"
              // layout="responsive"
              // width={10}
              // height={10}
              className="w-10 h-10 -mt-1 shadow-black/50 transition-transform duration-300"
            />
                <h1 className="text-xl font-bold text-gray-700 ml-1">Gr<span className='text-green-700'>ocer</span>y Mart</h1>
            </div>
            <div className="p-">
              <p className="text-gray-500 text-2xl font-bold text-right">Invoice</p>
              <div className="w-full p-2">
                <div className="flex items-center justify-between space-x-1">
                  <p className="text-gray-500 text-sm">Order Id</p>
                  <p className="text-gray-500 text-sm">:</p>
                  <p className="text-gray-500 text-sm text-left">{invoiceData.orderId}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-500 text-sm">Invoice Date</p>
                  <p className="text-gray-500 text-sm">:</p>
                  <p className="text-gray-500 text-sm text-left">{new Date(date).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4 border-b pb-4">
            <p className="text-gray-600 text-sm">
              <span className="font-medium">Order Placed:</span> {formatDate(orderPlacedDate)}
            </p>
            <p className="text-gray-600 text-sm">
              <span className="font-medium">Payment Status:</span> {invoiceData.paymentStatus}
            </p>
          </div>

          <div className="mb-4">
            <p>Invoice To</p>
            {invoiceData.selectedAddressId && (
            <div>
              {(() => {
                const selectedAddress = address.find(address => address.id === invoiceData.selectedAddressId);
                return (
                  <>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">Name</span> : {selectedAddress ? selectedAddress.name : "Pin code Not Found"}
                    </p>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">Address</span> : { selectedAddress ? [
                        selectedAddress.floor,
                        selectedAddress.address,
                        selectedAddress.landmark,
                        selectedAddress.area,
                        selectedAddress.block,
                        selectedAddress.state,
                        selectedAddress.country,
                      ]
                        .filter(Boolean)
                        .join(", ")
                      : "Not Found"}
                    </p>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">Pin code</span> : {selectedAddress ? selectedAddress.pinCode : "Pin code Not Found"}
                    </p>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">State</span> : {selectedAddress ? selectedAddress.state : "Pin code Not Found"}
                    </p>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <Table className="border-t">
            <TableHeader>
              <TableRow className="font-bold">
                <TableHead className="w-[%]">Sr. no</TableHead>
                <TableHead className="w-[%]">Item</TableHead>
                <TableHead className="w-[%]">MRP</TableHead>
                <TableHead className="w-[%]">Quantity</TableHead>
                <TableHead className="w-[%]">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceData.items.map((item, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell>{index+1}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.price}</TableCell>
                  <TableCell className="">{item.quantity}</TableCell>
                  <TableCell className="font-bold">₹{item.price * Number(item.quantity)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold">
                <TableCell className="">Total:</TableCell>
                <TableCell colSpan={2}></TableCell>
                <TableCell className="">{invoiceData.totalItem}</TableCell>
                <TableCell className="">₹{invoiceData.totalPrice}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="border-b border-gray-200"></p>

          <div className="mt-6 pt-4">
            <div className="flex justify-between text-gray-600 text-sm mb-2">
              <span>Discount</span>
              <span className="font-medium">-₹{invoiceData.discount}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-sm mb-2">
              <span className="flex items-center">
                Delivery Charges
              </span>
              <span className="text-blue-500 text-sm font-bold">FREE</span>
            </div>
            <div className="flex justify-between text-gray-800 text-md font-bold mt-4">
              <span>Total</span>
              <span>₹{invoiceData.totalPrice}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default InvoicePdf;



{/* <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="border border-gray-300 px-3 py-2 rounded w-full"
          placeholder="Enter new category"
        />
        <button
          onClick={handleAddCategory}
          className="text-blue-500 bg-blue-100 border-blue-500 border rounded-md px-7 py-2"
        >
          Add
        </button>
      </div> */}