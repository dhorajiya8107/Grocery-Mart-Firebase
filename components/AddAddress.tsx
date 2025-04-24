"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "@/components/ui/button";
import FloatingLabelInput from "@/components/form-fields/FloatingLabelInput";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDocs, query, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "@/app/src/firebase";
import { Home, Briefcase, Hotel, MapPin } from "lucide-react";
import AddressTypeButton from "./form-fields/AddressTypeButton";
import { toast } from "sonner";

// Validation schema using yup
const schema = yup.object().shape({
  address: yup.string().min(1, "Building name is required").required("Building name is required"),
  floor: yup.string().optional(),
  area: yup.string().min(4, "Area is required").required("Area is required"),
  landmark: yup.string().optional(),
  name: yup.string().min(3, "Name is required").required("Name is required"),
  phoneNumber: yup
    .string()
    .matches(/^\d{10}$/, "Enter valid phone number.")
    .required("Enter valid phone number."),
  pinCode: yup
    .string()
    .matches(/^\d{6}$/, "Enter valid pin code.")
    .required("Enter valid pin code."),
  addressType: yup
    .mixed<"home" | "work" | "hotel" | "other">()
    .oneOf(["home", "work", "hotel", "other"], "Invalid address type")
    .default("home"),
});

interface Address {
  defaultAddress?: boolean;
  address: string;
  floor?: string;
  area: string;
  landmark?: string;
  name: string;
  phoneNumber: string;
  addressId?: string;
  createdAt?: number;
  updatedAt?: number;
  addressType: "home" | "work" | "hotel" | "other";
  pinCode: string;
  block?: string;
  state?: string;
  country?: string;
}

interface PostOffice {
  Block?: string;
  State: string;
  Country: string;
}

interface AddAddressPageProps {
  activeDialog: "sign-up" | "log-in" | "forget-password" | "change-password" | "address" | null
  setActiveDialog: React.Dispatch<
    React.SetStateAction<"sign-up" | "log-in" | "forget-password" | "change-password" | "address" | null>
  >
}

const AddAddressPage: React.FC<AddAddressPageProps> = ({ activeDialog, setActiveDialog }) => {
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [currentAddressId, setCurrentAddressId] = useState<string | null>(null)
  const [mode, setMode] = useState<"view" | "add" | "edit">("view")
  const [addressType, setAddressType] = useState<"home" | "work" | "hotel" | "other">("home")
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [postalData, setPostalData] = useState<PostOffice | null>(null);

  // Apply validation
  const form = useForm<Address>({
    resolver: yupResolver(schema),
    defaultValues: {
      address: "",
      floor: "",
      area: "",
      landmark: "",
      name: "",
      phoneNumber: "",
      addressType: "home",
      pinCode: "",
      block: "",
      state: "",
      country: "",
    },
  });
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
    setValue,
    watch,
  } = form

  const currentAddressType = watch("addressType")

  useEffect(() => {
    setValue("addressType", addressType)
  }, [addressType, setValue])

  useEffect(() => {
    const auth = getAuth()

    const fetchAddresses = async (userId: string) => {
      try {
        const addressRef = collection(db, "addresses")
        const querySnapshot = await getDocs(query(addressRef, where("userId", "==", userId)))

        if (!querySnapshot.empty) {
          const addressesData = querySnapshot.docs.map((doc) => doc.data() as Address)
          setAddresses(addressesData)
          setMode("view")
        } else {
          setMode("add")
        }
      } catch (error) {
        console.error("Error fetching addresses:", error)
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        fetchAddresses(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle save address
  const saveAddress = async (data: Address) => {
    if (!userId) {
      setError("You must be logged in to save your address.");
      return;
    }
  
    try {
      const timestamp = Date.now();
      const addressesRef = collection(db, "addresses");
      const querySnapshot = await getDocs(query(addressesRef, where("userId", "==", userId)));
  
      const batch = writeBatch(db);
      querySnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { defaultAddress: false });
      });
  
      let addressRef;
  
      if (isEditing && currentAddressId) {
        addressRef = doc(db, "addresses", currentAddressId);
        batch.update(addressRef, {
          ...data,
          updatedAt: timestamp,
          defaultAddress: true,
        });
        console.log("Address updated with ID:", currentAddressId);
      } else {
        addressRef = doc(collection(db, "addresses"));
        batch.set(addressRef, {
          addressId: addressRef.id,
          userId,
          ...data,
          createdAt: timestamp,
          updatedAt: timestamp,
          defaultAddress: true,
        });
        console.log("New address saved with ID:", addressRef.id);
      }
  
      await batch.commit();
  
      const updatedSnapshot = await getDocs(query(addressesRef, where("userId", "==", userId)));
      const addressesData = updatedSnapshot.docs.map((doc) => doc.data() as Address);
      setAddresses(addressesData);
  
      setSuccess(true);
      setError("");
      setMode("view");
      setIsEditing(false);
      setCurrentAddressId(null);
      reset();
      setTimeout(() => setSuccess(false), 3000);
  
      setActiveDialog(null);
    } catch (err) {
      console.error("Error saving address:", err);
      setError("Failed to save address. Please try again.");
    }
  };

  // Handle edit address
  const handleEditAddress = (address: Address) => {
    if (address.addressId) {
      setCurrentAddressId(address.addressId);
      reset(address);
      setAddressType(address.addressType || "home");
      setIsEditing(true);
      setMode("edit");
      reset(address);
    }
  }

  // For adding new address
  const handleAddNewAddress = () => {
    reset({
      address: "",
      floor: "",
      area: "",
      landmark: "",
      name: "",
      phoneNumber: "",
      addressType: "home",
      pinCode: "",
      block: "",
      state: "",
      country: "",
    })
    setAddressType("home")
    setIsEditing(false)
    setCurrentAddressId(null)
    setMode("add")
  }

  // By selecting, it set as the default address
  const handleSelectAddress = async (selectedAddressId: string) => {
    if (!userId) return;
  
    setSelectedAddress(selectedAddressId);
  
    try {
      // Get only the addresses of the current user
      const addressesSnapshot = await getDocs(query(collection(db, "addresses"), where("userId", "==", userId)));
  
      const batch = writeBatch(db);
  
      addressesSnapshot.docs.forEach((addressDoc) => {
        const isSelected = addressDoc.id === selectedAddressId;
        batch.update(addressDoc.ref, { defaultAddress: isSelected });
      });
  
      await batch.commit();
  
      setActiveDialog(null);
      toast.success("Delivery address has been selected.", {
        style: { backgroundColor: '', color: 'green' },
      });
    } catch (error) {
      console.error("Error updating default address:", error);
    }
  };
  

  // Fetch postal data by pincode
  const pinCode = watch("pinCode")

  const fetchPostalDetails = async (pinCode: string) => {
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pinCode}`)
      if (!response.ok) throw new Error("Failed to fetch data")

      const data = await response.json()
      if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
        const postOffice = data[0].PostOffice[0]
        setPostalData({
          Block: postOffice.Block || "",
          State: postOffice.State,
          Country: postOffice.Country,
        })

        setValue("block", postOffice.Block || "")
        setValue("state", postOffice.State)
        setValue("country", postOffice.Country)
      } else {
        setPostalData(null)
        setValue("block", "")
        setValue("state", "")
        setValue("country", "")
      }
    } catch (error) {
      console.error("Error fetching postal details:", error)
      setPostalData(null)
      setValue("block", "")
      setValue("state", "")
      setValue("country", "")
    }
  }

  useEffect(() => {
    if (pinCode && pinCode.length === 6) {
      const timeout = setTimeout(() => fetchPostalDetails(pinCode), 500);
      return () => clearTimeout(timeout);
    }
  }, [pinCode]);

return (
  <Dialog open={activeDialog === "address"} onOpenChange={() => setActiveDialog(null)}>
    <DialogContent className="md:max-w-lg bg-white rounded-lg p-4 md:p-6 shadow-lg">
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold">
          {mode === "view" ? "Your Addresses" : mode === "edit" ? "Edit Address" : "Add New Address"}
        </DialogTitle>
      </DialogHeader>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {mode === "view" && (
        <div className="space-y-4">
          {addresses.length > 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-1">
                {addresses
                  .sort((a, b) => new Date(a.updatedAt!).getTime() - new Date(b.updatedAt!).getTime())
                  .map((address, index) => (
                    <div
                    key={address.addressId || index}
                    className={`border rounded-lg p-4 relative hover:shadow-md transition-shadow bg-white cursor-pointer 
                      ${selectedAddress === address.addressId 
                        ? address.defaultAddress 
                          ? "border-green-700"
                          : "border-gray-300"
                        : address.defaultAddress 
                          ? "border-green-700"
                          : "border-gray-300"
                      }`}
                    onClick={() =>
                      address.addressId && handleSelectAddress(address.addressId)
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {address.addressType === "home" && <Home size={20} className="text-green-700" />}
                        {address.addressType === "work" && <Briefcase size={20} className="text-green-700" />}
                        {address.addressType === "hotel" && <Hotel size={20} className="text-green-700" />}
                        {address.addressType === "other" && <MapPin size={20} className="text-green-700" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-base capitalize">{address.addressType || "Home"}</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAddress(address);
                            }}
                          >
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 15 15"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z"
                                fill="green"
                                fillRule="evenodd"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          </Button>
                        </div>
                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                          {[
                            address.floor,
                            address.address,
                            address.landmark,
                            address.area,
                            address.block,
                            address.state,
                            address.country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={handleAddNewAddress} className="w-full mt-4 bg-primary hover:bg-primary/90">
                Add New Address
              </Button>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <MapPin size={24} className="text-primary" />
              </div>
              <p className="text-gray-600 mb-4">You haven't added any addresses yet.</p>
              <Button onClick={handleAddNewAddress} className="bg-primary hover:bg-primary/90">
                Add Your First Address
              </Button>
            </div>
          )}
        </div>
      )}

      {(mode === "add" || mode === "edit") && (
        <FormProvider {...form}>
          <form onSubmit={handleSubmit(saveAddress)} className="space-y-6 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Save address as *</label>
              <div className="grid grid-cols-4 gap-2">
                <div className="relative">
                  <AddressTypeButton
                    type="home"
                    icon={Home}
                    label="Home"
                    selected={currentAddressType === "home"}
                    onClick={() => {
                      setAddressType("home")
                      setValue("addressType", "home")
                    }}
                  />
                </div>
                <div className="relative">
                  <AddressTypeButton
                    type="work"
                    icon={Briefcase}
                    label="Work"
                    selected={currentAddressType === "work"}
                    onClick={() => {
                      setAddressType("work")
                      setValue("addressType", "work")
                    }}
                  />
                </div>
                <div className="relative">
                  <AddressTypeButton
                    type="hotel"
                    icon={Hotel}
                    label="Hotel"
                    selected={currentAddressType === "hotel"}
                    onClick={() => {
                      setAddressType("hotel")
                      setValue("addressType", "hotel")
                    }}
                  />
                </div>
                <div className="relative">
                  <AddressTypeButton
                    type="other"
                    icon={MapPin}
                    label="Other"
                    selected={currentAddressType === "other"}
                    onClick={() => {
                      setAddressType("other")
                      setValue("addressType", "other")
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FloatingLabelInput control={control} name="name" type="text" label="Your Name *" />
              <FloatingLabelInput control={control} name="phoneNumber" type="number" label="Your phone number *" className=""/>
            </div>

            {/* <FloatingLabelInput
              control={control}
              name="address"
              type="text"
              label="Flat / House no / Building name *"
            /> */}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <FloatingLabelInput control={control} name="pinCode" type="number" label="Your PinCode *" />
                {postalData && (
        <div className="mt-1 text-xs text-gray-600 pl-1">
          {[postalData.Block, postalData.State, postalData.Country]
            .filter(Boolean)
            .join(", ")}
        </div>
      )}
              </div>
              <FloatingLabelInput control={control} name="address" type="text" label="Flat / House no *" className=""/>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FloatingLabelInput control={control} name="floor" type="text" label="Floor (optional)" />
              <FloatingLabelInput control={control} name="landmark" type="text" label="Nearby landmark (optional)" />
            </div>

            <FloatingLabelInput control={control} name="area" type="text" label="Area / Sector / Locality *" />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setMode("view")
                  setIsEditing(false)
                  setCurrentAddressId(null)
                  reset()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditing ? "Update Address" : "Save Address"}
              </Button>
            </div>
          </form>
        </FormProvider>
      )}
    </DialogContent>
  </Dialog>
)
}

export default AddAddressPage;