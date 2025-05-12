"use client";

import React from "react";

import { db } from "@/app/src/firebase";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDoc, collection, doc, getDocs, setDoc } from "firebase/firestore";
import { CalendarIcon, PackagePlus, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast, Toaster } from "sonner";
import { z } from "zod";

type Category = {
  id: string;
  name: string;
}

const formSchema = z
  .object({
    productName: z.string().min(1, "Product name is required"),
    description: z.string().min(1, "Description is required"),
    price: z.string().min(1, "Price is required"),
    discountedPrice: z.string().min(1, "Discounted price is required"),
    buckleNumber: z.string().length(6, "Buckle number must be exactly 6 digits"),
    quantity: z.string().min(1, "Quantity is required"),
    categoryId: z.string().min(1, "Category is required"),
    images: z.array(z.instanceof(File)).min(1, "At least one image is required"),
    manufacturedAt: z.string().min(1, "Manufactured date is required"),
    expiresAt: z.string().min(1, "Expires date is required"),
  })
  .refine(
    (data) => {
      const price = Number.parseFloat(data.price);
      const discounted = Number.parseFloat(data.discountedPrice);
      return discounted <= price;
    },
    {
      message: "Discounted price must be less than or equal to the original price.",
      path: ["discountedPrice"],
    },
  )
  .refine(
    (data) => {
      const manufacturedAt = new Date(data.manufacturedAt);
      const expiresAt = new Date(data.expiresAt);
      return manufacturedAt < expiresAt;
    },
    {
      message: "Expiry date must be after to manufactured date.",
      path: ["expiresAt"],
    },
  )

const AddProductForm = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [openMD, setOpenMD] = useState(false);
  const [openED, setOpenED] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      description: "",
      price: "",
      discountedPrice: "",
      buckleNumber: "",
      quantity: "",
      categoryId: "",
      manufacturedAt: "",
      expiresAt: "",
      images: [] as File[],
    },
  })

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, "categories"));
        const categoryList: Category[] = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            name: doc.data().name,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setCategories(categoryList);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }

    fetchCategories()
  }, [])

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      }
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    })
  }

  const onSubmit = async (data: any) => {
    try {
      if (data.images.length === 0) {
        toast.error("At least one image is required");
        return;
      }

      const imageBase64Array = await Promise.all(data.images.map((file: File) => convertToBase64(file)));

      const selectedCategory = categories.find((cat) => cat.id === data.categoryId);
      const categoryName = selectedCategory ? selectedCategory.name : "";

      const productRef = await addDoc(collection(db, "products"), {
        productName: data.productName,
        description: data.description,
        price: data.price,
        discountedPrice: data.discountedPrice,
        buckleNumber: data.buckleNumber,
        quantity: data.quantity,
        category: categoryName,
        imageUrl: imageBase64Array[0],
        manufacturedAt: data.manufacturedAt,
        expiresAt: data.expiresAt,
      })

      const imagesData: Record<string, string> = {};

      imageBase64Array.forEach((imageUrl, index) => {
        imagesData[`imageUrl${index === 0 ? "" : index}`] = imageUrl;
      })

      await setDoc(doc(db, "productImages", productRef.id), {
        ...imagesData,
        productId: productRef.id,
        createdAt: new Date().toISOString(),
      })

      toast.success("Product added successfully", {
        style: { color: 'green' }
      });
      setImagePreviews([]);
      reset()
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
    }
  }

  // const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const files = e.target.files;
  //   if (files && files.length > 0) {
  //     const fileArray = Array.from(files);
  //     setValue("images", [...watch("images"), ...fileArray]);

  //     try {
  //       const newPreviews = await Promise.all(fileArray.map((file) => convertToBase64(file)));
  //       setImagePreviews((prev) => [...prev, ...newPreviews]);
  //     } catch (error) {
  //       console.error("Error creating previews:", error);
  //     }
  //   }
  // }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setValue("images", [...watch("images"), ...fileArray]);

      try {
        const newPreviews = await Promise.all(fileArray.map((file) => convertToBase64(file)));
        setImagePreviews((prev) => [...prev, ...newPreviews]);
      } catch (error) {
        console.error("Error creating previews:", error);
      }

      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = [...watch("images")];
    updatedImages.splice(index, 1);
    setValue("images", updatedImages);

    const updatedPreviews = [...imagePreviews];
    updatedPreviews.splice(index, 1);
    setImagePreviews(updatedPreviews);
  }

  const clearAllImages = () => {
    setImagePreviews([]);
    setValue("images", []);
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-CA").format(date);
  }

  return (
    <>
      <Toaster />
      <Card className="max-w-5xl mx-auto shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex text-2xl md:text-3xl font-bold items-center justify-center">
                <PackagePlus className="h-10 w-10 p-2 bg-green-50 rounded-full text-green-700 opacity-80 mr-2" />
                Add New Product
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="productName" className="font-medium">
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="productName"
                    {...register("productName")}
                    placeholder="Enter product name"
                    className="h-11"
                  />
                  {errors.productName && <p className="text-red-500 text-sm">{errors.productName.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="font-medium">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                        <SelectTrigger id="category" className="h-11 w-full">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.categoryId && <p className="text-red-500 text-sm">{errors.categoryId.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description" className="font-medium">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Enter product description"
                    className="min-h-[100px] resize-none"
                  />
                  {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 border-b pb-2">Pricing & Inventory</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price" className="font-medium">
                    Price (₹) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    {...register("price")}
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="h-11"
                  />
                  {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountedPrice" className="font-medium">
                    Discounted Price (₹) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="discountedPrice"
                    {...register("discountedPrice")}
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="h-11"
                  />
                  {errors.discountedPrice && <p className="text-red-500 text-sm">{errors.discountedPrice.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity" className="font-medium">
                    Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    {...register("quantity")}
                    type="number"
                    placeholder="0"
                    min="0"
                    className="h-11"
                  />
                  {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity.message}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 border-b pb-2">Additional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="buckleNumber" className="font-medium">
                    Buckle Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="buckleNumber"
                    {...register("buckleNumber")}
                    type="number"
                    placeholder="6-digit number"
                    className="h-11"
                  />
                  {errors.buckleNumber && <p className="text-red-500 text-sm">{errors.buckleNumber.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="manufacturedDate" className="font-medium">
                    Manufactured Date <span className="text-red-500">*</span>
                  </Label>
                  <Popover open={openMD} onOpenChange={setOpenMD}>
                    <PopoverTrigger asChild>
                      <Button
                        id="manufacturedDate"
                        variant="outline"
                        className="w-full justify-start h-11 text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watch("manufacturedAt") || "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={watch("manufacturedAt") ? new Date(watch("manufacturedAt")) : undefined}
                        onSelect={(date) => {
                          setValue("manufacturedAt", date ? formatDate(date) : "")
                          setOpenMD(false)
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.manufacturedAt && <p className="text-red-500 text-sm">{errors.manufacturedAt.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate" className="font-medium">
                    Expiry Date <span className="text-red-500">*</span>
                  </Label>
                  <Popover open={openED} onOpenChange={setOpenED}>
                    <PopoverTrigger asChild>
                      <Button
                        id="expiryDate"
                        variant="outline"
                        className="w-full justify-start h-11 text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watch("expiresAt") || "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={watch("expiresAt") ? new Date(watch("expiresAt")) : undefined}
                        onSelect={(date) => {
                          setValue("expiresAt", date ? formatDate(date) : "")
                          setOpenED(false)
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.expiresAt && <p className="text-red-500 text-sm">{errors.expiresAt.message}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 border-b pb-2">Product Images</h3>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="image" className="font-medium">
                    Product Images <span className="text-red-500">*</span>
                    <span className="text-sm text-gray-500 ml-2">(First image will be the main product image)</span>
                  </Label>
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-lg p-4 w-full transition-colors",
                        errors.images
                          ? "border-red-400 bg-red-50"
                          : "border-gray-200 hover:border-green-700 hover:bg-green-50",
                      )}
                    >
                      <label htmlFor="image-upload" className="flex flex-col items-center gap-2 cursor-pointer">
                        <Upload className="h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-500">Click to upload multiple images</span>
                        <span className="text-xs text-gray-400">PNG, JPG up to 10MB</span>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          multiple
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>
                  {errors.images && <p className="text-red-500 text-sm">{errors.images.message}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="font-medium">Image Previews</Label>
                    {imagePreviews.length > 0 && (
                      <Button
                        type="button"
                        onClick={clearAllImages}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                  {imagePreviews.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative border rounded-lg overflow-hidden h-full w-full">
                          <img
                            src={preview || "/placeholder.svg"}
                            alt={`Product preview ${index + 1}`}
                            className="object-cover w-full h-full"
                          />
                          <Button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 h-6 w-6 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          {index === 0 && (
                            <div className="absolute bottom-0 left-0 right-0 bg-green-700 text-white text-xs py-1 text-center">
                              Main Image
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border rounded-lg h-[150px] flex items-center justify-center bg-gray-50">
                      <span className="text-gray-400 text-sm">No images selected</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
              <Button
                type="submit"
                className="bg-green-700 hover:bg-green-800 text-white py-6 px-5"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Product"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="py-6 px-5 bg-gray-300"
                onClick={() => {
                  reset()
                  setImagePreviews([])
                  router.push("/")
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  )
}

export default AddProductForm;
