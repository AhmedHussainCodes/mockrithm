"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRouter } from "next/navigation";

// shadcn/ui components
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// lucide-react icons
import {
  MoreVertical,
  Info,
  Activity as ActivityIcon,
  Users,
  MessageSquare,
  Activity,
  TrendingUp,
} from "lucide-react";

// firebase
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "@/firebase/client";
import { onAuthStateChanged } from "firebase/auth";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export async function getTotalSessions() {
  const snapshot = await getDocs(collection(db, "sessions"));
  return snapshot.size;
}

// Types
type User = {
  id: string;
  name?: string;
  email?: string;
  createdAt?: any;
};

type Feedback = {
  id: string;
  name?: string;
  email?: string;
  message?: string;
  createdAt?: any;
};

type ActivityItem = {
  id: string;
  user: string | undefined;
  action: string;
  createdAt: any;
  type: "user" | "feedback";
};

export default function AdminDashboard() {
  // State
  const [userCount, setUserCount] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentFeedbacks, setRecentFeedbacks] = useState<Feedback[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"all" | "user" | "feedback">("all");
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Refs
  const parallaxRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);
  const animationContextRef = useRef<gsap.Context | null>(null);

  const router = useRouter();

  // Memoized combined activity to prevent unnecessary recalculations
  const combinedActivity = useMemo<ActivityItem[]>(() => {
    if (!isDataLoaded) return [];

    const userActivities = recentUsers.map((user) => ({
      id: user.id,
      user: user.name || user.email,
      action: "Signed up",
      createdAt: user.createdAt || null,
      type: "user" as const,
    }));

    const feedbackActivities = recentFeedbacks.map((f) => ({
      id: f.id,
      user: f.name || f.email,
      action: "Submitted feedback",
      createdAt: f.createdAt || null,
      type: "feedback" as const,
    }));

    return [...userActivities, ...feedbackActivities].sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return bTime - aTime;
    });
  }, [recentUsers, recentFeedbacks, isDataLoaded]);

  // Memoized filtered activity
  const filteredActivity = useMemo(() => {
    if (activeTab === "all") return combinedActivity;
    return combinedActivity.filter((item) => item.type === activeTab);
  }, [combinedActivity, activeTab]);

  // Memoized activity counts
  const activityCounts = useMemo(() => ({
    all: combinedActivity.length,
    user: combinedActivity.filter(item => item.type === "user").length,
    feedback: combinedActivity.filter(item => item.type === "feedback").length,
  }), [combinedActivity]);

  // Memoized metrics
  const metrics = useMemo(() => [
    { title: "Total Users", value: userCount, change: "+12%", icon: Users },
    { title: "Total Feedbacks", value: feedbackCount, change: "+8%", icon: MessageSquare },
    { title: "Total Sessions", value: sessionCount, change: "+5%", icon: Activity },
    { title: "Growth Rate", value: "12%", change: "+5%", icon: TrendingUp },
  ], [userCount, feedbackCount, sessionCount]);

 
  const handleExportJSON = useCallback(() => {
    console.log("Export JSON clicked");
    const data = { users: recentUsers, feedbacks: recentFeedbacks };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "activity.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [recentUsers, recentFeedbacks]);

  const handleRefresh = useCallback(() => {
    console.log("Refresh clicked");
    window.location.reload();
  }, []);

  const handleTabChange = useCallback((value: "all" | "user" | "feedback") => {
    setActiveTab(value);
  }, []);

  // Initialize GSAP animations
  const initializeAnimations = useCallback(() => {
    if (typeof window === "undefined" || !activityRef.current || filteredActivity.length === 0) {
      return;
    }

    // Clean up existing animations
    if (animationContextRef.current) {
      animationContextRef.current.revert();
    }

    // Create new animation context
    animationContextRef.current = gsap.context(() => {
      // Reset initial states
      gsap.set('.activity-row', { y: 20, opacity: 0 });
      gsap.set('.activity-avatar', { scale: 0.9 });

      // Staggered reveal animation
      ScrollTrigger.create({
        trigger: activityRef.current,
        start: "top 85%",
        end: "bottom 15%",
        onEnter: () => {
          gsap.to('.activity-row', {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.06,
            ease: "power2.out"
          });
          gsap.to('.activity-avatar', {
            scale: 1,
            duration: 0.8,
            stagger: 0.06,
            delay: 0.1,
            ease: "back.out(1.7)"
          });
        },
        onLeave: () => {
          gsap.set('.activity-row', { y: 20, opacity: 0 });
          gsap.set('.activity-avatar', { scale: 0.9 });
        },
        onEnterBack: () => {
          gsap.to('.activity-row', {
            y: 0,
            opacity: 1,
            duration: 0.4,
            stagger: 0.04,
            ease: "power2.out"
          });
          gsap.to('.activity-avatar', {
            scale: 1,
            duration: 0.6,
            stagger: 0.04,
            ease: "back.out(1.7)"
          });
        }
      });

      // Parallax highlight bar
      if (parallaxRef.current) {
        ScrollTrigger.create({
          trigger: activityRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
          onUpdate: (self) => {
            gsap.set(parallaxRef.current, {
              y: self.progress * 120,
            });
          }
        });
      }
    });
  }, [filteredActivity.length]);

  // Fetch sessions data
  useEffect(() => {
    let isMounted = true;

    const fetchSessions = async () => {
      try {
        const totalSessions = await getTotalSessions();
        if (isMounted) {
          setSessionCount(totalSessions);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
      }
    };

    fetchSessions();
    return () => { isMounted = false; };
  }, []);

  // Authentication check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || user.email !== "ahmed@gmail.com") {
        router.push("/sign-in");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        console.log("Admin authenticated:", user.email);
      } catch (error) {
        console.error("Error checking user document:", error);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch main data
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [usersSnap, feedbackSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "feedback"))
        ]);

        if (!isMounted) return;

        setUserCount(usersSnap.size);
        setFeedbackCount(feedbackSnap.size);

        const [recentUsersSnap, recentFeedbacksSnap] = await Promise.all([
          getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"), limit(10))),
          getDocs(query(collection(db, "feedback"), orderBy("createdAt", "desc"), limit(10)))
        ]);

        if (!isMounted) return;

        setRecentUsers(
          recentUsersSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );

        setRecentFeedbacks(
          recentFeedbacksSnap.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || "",
              email: data.email || "",
              message: data.message || "",
              createdAt: data.createdAt || null,
            };
          })
        );

        setIsDataLoaded(true);
      } catch (err) {
        console.error("Error loading admin data:", err);
      }
    };

    fetchData();

    // Animate metrics cards
    const timeout = setTimeout(() => {
      if (isMounted) {
        gsap.fromTo(
          ".metric-card",
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
          }
        );
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []);

  // Setup animations when filtered activity changes
  useEffect(() => {
    if (!isDataLoaded) return;

    const timeoutId = setTimeout(() => {
      initializeAnimations();
    }, 100); // Small delay to ensure DOM is ready

    return () => {
      clearTimeout(timeoutId);
    };
  }, [initializeAnimations, isDataLoaded, activeTab]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationContextRef.current) {
        animationContextRef.current.revert();
      }
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-400 mt-2">
          Welcome back! Here's what's happening.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card
            key={metric.title}
            className="metric-card bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-gray-400">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="text-xs text-green-400 mt-1">
                {metric.change} from last month
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Section */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm relative overflow-hidden">
        <div
          ref={parallaxRef}
          className="activity-parallax absolute left-0 w-0.5 h-8 bg-gradient-to-b from-transparent via-white/30 to-transparent -translate-y-full"
        />

        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <ActivityIcon className="h-5 w-5 text-gray-400" />
                Recent Activity
              </CardTitle>
              <p className="text-sm text-gray-400">
                Latest users and feedback events
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-black/90 border-white/20 text-white text-xs"
                >
                  Scroll to see staggered reveal animation
                </TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-black/95 border-white/20 text-white"
                >
                  <DropdownMenuItem
                    onClick={handleExportJSON}
                    className="hover:bg-white/10 focus:bg-white/10"
                  >
                    Export JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleRefresh}
                    className="hover:bg-white/10 focus:bg-white/10"
                  >
                    Refresh
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Filter tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400"
              >
                All ({activityCounts.all})
              </TabsTrigger>
              <TabsTrigger
                value="user"
                className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400"
              >
                Users ({activityCounts.user})
              </TabsTrigger>
              <TabsTrigger
                value="feedback"
                className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400"
              >
                Feedback ({activityCounts.feedback})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="pt-0">
          {filteredActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ActivityIcon className="h-12 w-12 text-gray-600 mb-3" />
              <h3 className="text-lg font-medium text-gray-300 mb-1">
                No Activity
              </h3>
              <p className="text-sm text-gray-500">
                {activeTab === "all"
                  ? "No recent activity to display"
                  : `No ${activeTab} activity found`}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[360px] pr-4" ref={activityRef}>
              <div className="space-y-0 activity-list">
                {filteredActivity.map((activity, index) => (
                  <div key={activity.id}>
                    <div className="activity-row group flex justify-between items-center p-4 hover:-translate-y-0.5 hover:ring-1 hover:ring-white/10 rounded-lg transition-all duration-200 hover:bg-white/[0.02]">
                      <div className="flex items-center gap-4">
                        <Avatar className="activity-avatar h-10 w-10 ring-1 ring-white/10">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-900 text-white text-sm font-bold">
                            {activity.user
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("") || "?"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white truncate">
                            {activity.user || "Unknown User"}
                          </p>
                          <p className="text-sm text-gray-400 truncate">
                            {activity.action}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          variant="secondary"
                          className={`capitalize text-xs font-medium ${
                            activity.type === "user"
                              ? "bg-white/10 text-gray-300 border-white/20"
                              : "bg-gray-800/80 text-gray-400 border-gray-700/50"
                          }`}
                        >
                          {activity.type}
                        </Badge>
                        <p className="text-xs text-gray-500 tabular-nums">
                          {activity.createdAt?.toDate
                            ? activity.createdAt.toDate().toLocaleString()
                            : "Recently"}
                        </p>
                      </div>
                    </div>
                    {index < filteredActivity.length - 1 && (
                      <Separator className="bg-white/5 my-1" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}