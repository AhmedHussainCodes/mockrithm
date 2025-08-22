"use client"

import { useEffect, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  Search, Plus, Pencil, Trash2, MoreHorizontal,
} from "lucide-react"
import {
  collection, getDocs, query, orderBy, addDoc, Timestamp
} from "firebase/firestore"
import { db } from "@/firebase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface Interview {
  id: string
  role: string
  level: string
  type: string
  techStack: string
  userId: string
  createdAt: any
  status: string
}

export default function InterviewsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    role: "",
    level: "",
    type: "",
    techStack: "",
    userId: "",
    status: "Draft",
  })

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const q = query(collection(db, "interviews"), orderBy("createdAt", "desc"))
        const snap = await getDocs(q)
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Interview[]

        setInterviews(data)
      } catch (err) {
        console.error("Error fetching interviews:", err)
      }
    }

    fetchInterviews()

    gsap.fromTo(
      ".interviews-card",
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".interviews-card",
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      }
    )

    gsap.fromTo(
      ".table-row",
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.3,
      }
    )

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [])

  const handleDeleteInterview = (id: string) => {
    setInterviews((prev) => prev.filter((i) => i.id !== id))
  }

  const handleCreateInterview = async () => {
    try {
      const newInterview = {
        ...form,
        createdAt: Timestamp.now(),
      }

      const docRef = await addDoc(collection(db, "interviews"), newInterview)

      setInterviews([{ id: docRef.id, ...newInterview }, ...interviews])
      setShowForm(false)
      setForm({ role: "", level: "", type: "", techStack: "", userId: "", status: "Draft" })
    } catch (err) {
      console.error("Failed to create interview:", err)
    }
  }

  const filteredInterviews = interviews.filter((i) => {
    const searchMatch =
      i.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.techStack.toLowerCase().includes(searchTerm.toLowerCase())
    const statusMatch = statusFilter === "All" || i.status === statusFilter
    return searchMatch && statusMatch
  })

  const formatDate = (date: any) => {
    const d = new Date(date?.seconds * 1000)
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  return (
    <div className="space-y-8 p-6 md:p-10 bg-black min-h-screen">

      {/* Add Interview Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="bg-black border border-white/20 p-6 rounded-lg w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold text-white">Create Interview</h2>

            <Input placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            <Input placeholder="Level" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} />
            <Input placeholder="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            <Input placeholder="Tech Stack" value={form.techStack} onChange={(e) => setForm({ ...form, techStack: e.target.value })} />
            <Input placeholder="User ID" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} />

            <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
              <SelectTrigger className="w-full bg-black text-white border-white/20">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-black text-white">
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Finalized">Finalized</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setShowForm(false)} className="text-white">Cancel</Button>
              <Button onClick={handleCreateInterview} className="bg-white text-black">Create</Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Interviews</h1>
          <p className="text-white/70 mt-2">Manage generated interviews</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-white text-black hover:bg-white/90">
          <Plus className="mr-2 h-4 w-4" /> Add Interview
        </Button>
      </div>

      {/* Main Table */}
      <Card className="interviews-card bg-black/50 backdrop-blur-sm border-white/10">
        <CardHeader className="border-b border-white/10">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <Input
                placeholder="Search by role or tech..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black/30 text-white border-white/10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-black text-white border-white/10">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-black text-white">
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Finalized">Finalized</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredInterviews.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-white/70">Role</TableHead>
                    <TableHead className="text-white/70">Level</TableHead>
                    <TableHead className="text-white/70">Type</TableHead>
                    <TableHead className="text-white/70">Tech Stack</TableHead>
                    <TableHead className="text-white/70">User ID</TableHead>
                    <TableHead className="text-white/70">Created At</TableHead>
                    <TableHead className="text-white/70 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInterviews.map((i) => (
                    <TableRow key={i.id} className="table-row border-white/10 hover:bg-white/5 transition-colors">
                      <TableCell className="text-white">{i.role}</TableCell>
                      <TableCell className="text-white/80">{i.level}</TableCell>
                      <TableCell className="text-white/80">{i.type}</TableCell>
                      <TableCell className="text-white/80">{i.techStack}</TableCell>
                      <TableCell className="text-white/60 font-mono">{i.userId}</TableCell>
                      <TableCell className="text-white/80">{formatDate(i.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-black border-white/10">
                            <DropdownMenuItem className="text-white hover:bg-white/10">
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteInterview(i.id)}
                              className="text-white hover:bg-white/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-white/70">No interviews found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
