'use client';

import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { auth, db } from '../src/firebase';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast, Toaster } from 'sonner';
import { CustomPagination } from '@/components/CustomPagination';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Shield, UserIcon, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
 
type User = {
  id: string;
  email: string;
  role: string;
  name: string;
}

const ChangeRole = () => {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Checking login user role
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setLoading(true);
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
  
          if (userSnap.exists()) {
            const userRole = userSnap.data()?.role;
            setRole(userRole);
  
            if (userRole !== 'superadmin') {
              router.push('/');
            }
          } else {
            router.push('/');
          }
        } catch (error) {
          console.error('Error checking user role:', error);
          router.push('/');
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/');
      }
    });
  
    return () => unsubscribe();
  }, [router]);

  // Fetch all users with their roles
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const userList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          email: doc.data().email,
          role: doc.data().role,
          name: doc.data().name,
        })).filter((user) => user.id !== auth.currentUser?.uid);
        setUsers(userList);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (role === 'superadmin') {
      fetchUsers();
    }
  }, [role]);

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())  ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleToggle = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      toast.success(`User role updated to ${newRole}`, {
        style: { color: 'green' },
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update user role');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 border-4 border-gray-300 border-t-green-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (role !== 'superadmin') {
    return ;
  }
  const indexOfLastCategory = currentPage * itemsPerPage;
  const indexOfFirstCategory = indexOfLastCategory - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstCategory, indexOfLastCategory);

  const adminCount = filteredUsers.filter((user) => user.role === "admin").length;
  const userCount = filteredUsers.filter((user) => user.role === "user").length;
  ;
  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <Card className="max-w-[1000px] mx-auto shadow-xl">
          <CardHeader className="bg-gradient-to-r rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex text-2xl md:text-3xl font-bold items-center justify-center">
                  <Users className="h-10 w-10 p-2 bg-green-50 rounded-full text-green-700 opacity-80 mr-2" />
                  User Management
                </CardTitle>
                <CardDescription className="mt-1 ml-12">Manage user roles and permissions</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 -mt-2">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="bg-green-100 border-green-200">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-medium">Admins</p>
                    <p className="text-2xl font-bold text-green-700">{adminCount}</p>
                  </div>
                  <Shield className="h-8 w-8 text-green-700" />
                </CardContent>
              </Card>

              <Card className="bg-sky-100 border-sky-200">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-sky-600 font-medium">Users</p>
                    <p className="text-2xl font-bold text-sky-700">{userCount}</p>
                  </div>
                  <UserIcon className="h-8 w-8 text-sky-500" />
                </CardContent>
              </Card>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search by email, name or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 border border-gray-200 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
              />
            </div>

            {/* User List */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-6 gap-4 bg-gray-50 p-4 font-medium text-gray-600 border-b border-gray-200">
                <div className="col-span-4 md:col-span-4">User</div>
                {/* <div className="col-span-4 md:col-span-5 text-right md:text-left">Email</div> */}
                <div className="col-span-2 text-right">Role</div>
              </div>

              <ul className="divide-y divide-gray-100">
                {currentUsers.map((user) => (
                  <li
                    key={user.id}
                    className="grid grid-cols-6 gap-4 p-4 items-center hover:bg-gray-50 transition duration-300"
                  >
                    <div className="col-span-4 md:col-span-4 font-medium truncate">
                      <div className="flex flex-col">
                        <span className="font-semibold">{user.name}</span>
                        <span className="text-gray-500 text-sm">{user.email}</span>
                      </div>
                    </div>
                    {/* <div className="col-span-4 md:col-span-5 text-right md:text-left text-gray-500 text-sm truncate">
                      {user.email}
                    </div> */}
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <Switch
                        checked={user.role === "admin"}
                        onCheckedChange={async (checked) => {
                          const newRole = checked ? "admin" : "user"
                          await handleRoleToggle(user.id, newRole)
                        }}
                        className="data-[state=checked]:bg-green-700"
                      />
                      <Badge
                        variant={user.role === "admin" ? "default" : "outline"}
                        className={
                          user.role === "admin"
                            ? "bg-green-700 hover:bg-green-700"
                            : "text-gray-500 border-gray-200"
                        }
                      >
                        {user.role}
                      </Badge>
                    </div>
                  </li>
                ))}

                {filteredUsers.length === 0 && (
                  <li className="text-gray-500 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-10 w-10 text-gray-300 mb-2" />
                      <p className="text-lg">No users found</p>
                      <p className="text-sm text-gray-400">Try a different search term</p>
                    </div>
                  </li>
                )}
              </ul>
            </div>

            {filteredUsers.length > 0 && (
              <div className="mt-6">
                <CustomPagination
                  totalCount={filteredUsers.length}
                  page={currentPage}
                  pageSize={itemsPerPage}
                  onPageChange={(newPage) => setCurrentPage(newPage)}
                  onPageSizeChange={(newSize) => {
                    setItemsPerPage(Number(newSize))
                    setCurrentPage(1)
                  }}
                  pageSizeOptions={[3, 5, 10, 15, 20, 50]}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default ChangeRole