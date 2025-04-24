"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { doc, setDoc, serverTimestamp, collection, addDoc } from "firebase/firestore"
import { db } from "@/app/src/firebase"
import { toast, Toaster } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface UserData {
  id: string
  name: string
  email: string
  role: string
  phoneNumber?: string
}

const availableRoles = [
  { id: "admin", name: "Admin" },
  { id: "manager", name: "Manager" },
  { id: "user", name: "User" },
  { id: "editor", name: "Editor" },
  { id: "analyst", name: "Analyst" },
  { id: "support", name: "Support" },
]

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  currentRole: z.string(),
  requestedRole: z.string().min(1, "Please select a role"),
  reason: z.string().min(10, "Please provide a reason with at least 10 characters"),
  duties: z.string().min(20, "Please describe your duties in at least 20 characters"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
})

type FormValues = z.infer<typeof formSchema>

export function RoleChangeForm({ userData }: { userData: UserData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: userData.name,
      email: userData.email,
      currentRole: userData.role,
      requestedRole: "",
      reason: "",
      duties: "",
      phoneNumber: userData.phoneNumber || "",
    },
  })

  const onSubmit = async (data: FormValues) => {

    setIsSubmitting(true)
    try {
      await addDoc(collection(db, "roleChangeRequests"), {
        userId: userData.id,
        name: data.name,
        email: data.email,
        currentRole: data.currentRole,
        requestedRole: data.requestedRole,
        reason: data.reason,
        duties: data.duties,
        phoneNumber: data.phoneNumber,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      if (data.phoneNumber !== userData.phoneNumber) {
        await setDoc(
          doc(db, "users", userData.id),
          {
            phoneNumber: data.phoneNumber,
          },
          { merge: true },
        )
      }

      toast.success("Role change request submitted successfully")
      form.reset({
        ...data,
        reason: "",
        duties: "",
        requestedRole: "",
      })
    } catch (error) {
      console.error("Error submitting role change request:", error)
      toast.error("Failed to submit request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Toaster position="top-right" />
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader className="">
          <CardTitle className="text-xl">Role Change Application</CardTitle>
          <CardDescription>Submit a request to change your role in the system</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-gray-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-gray-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Role</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-gray-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requestedRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requested Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableRoles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 pt-2 border-t">
                <h3 className="text-md font-medium text-gray-700">Phone Verification</h3>
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your phone number"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              

              {/* Application Details Section */}
              <div className="space-y-4 pt-2 border-t">
                <h3 className="text-md font-medium text-gray-700">Application Details</h3>

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Role Change</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please explain why you want to change your role..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Explain why you believe you are qualified for this role</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duties"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duties & Responsibilities</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the duties you expect to perform in this role..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Outline the key responsibilities you will undertake in the new role
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4 border-t pt-6">
          <Button
            type="submit"
            className="bg-green-700 hover:bg-green-800 w-full sm:w-auto"
            disabled={isSubmitting}
            onClick={form.handleSubmit(onSubmit)}
          >
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => form.reset()}>
            Reset Form
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}
