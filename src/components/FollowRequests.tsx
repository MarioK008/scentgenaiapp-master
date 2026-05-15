import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FollowRequest {
  id: string;
  follower_id: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export const FollowRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      const { data: follows, error: followsError } = await supabase
        .from("user_follows")
        .select("id, follower_id, created_at")
        .eq("followed_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (followsError) throw followsError;

      if (!follows || follows.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      // Get profiles separately
      const followerIds = follows.map(f => f.follower_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", followerIds);

      if (profilesError) throw profilesError;

      // Merge data
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const mergedRequests = follows.map(follow => ({
        ...follow,
        profiles: profilesMap.get(follow.follower_id) || { username: "Unknown", avatar_url: null }
      }));

      setRequests(mergedRequests);
    } catch (error) {
      console.error("Error fetching follow requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (requestId: string, action: "approved" | "rejected") => {
    try {
      if (action === "approved") {
        const { error } = await supabase
          .from("user_follows")
          .update({ status: "approved" })
          .eq("id", requestId);

        if (error) throw error;

        toast({
          title: "Request Approved",
          description: "You have a new follower!",
        });
      } else {
        const { error } = await supabase
          .from("user_follows")
          .delete()
          .eq("id", requestId);

        if (error) throw error;

        toast({
          title: "Request Rejected",
          description: "Follow request has been declined",
        });
      }

      fetchRequests();
    } catch (error) {
      console.error("Error handling request:", error);
      toast({
        title: "Error",
        description: "Failed to process request",
        variant: "destructive",
      });
    }
  };

  if (loading) return <div className="h-24 rounded-xl animate-pulse bg-muted mb-6" />;

  if (requests.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          <CardTitle>Follow Requests</CardTitle>
        </div>
        <CardDescription>
          {requests.length} pending {requests.length === 1 ? "request" : "requests"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <Avatar
                className="h-10 w-10 cursor-pointer"
                onClick={() => navigate(`/user/${request.follower_id}`)}
              >
                <AvatarImage src={request.profiles.avatar_url || undefined} />
                <AvatarFallback>
                  {request.profiles.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p
                  className="font-semibold cursor-pointer hover:underline"
                  onClick={() => navigate(`/user/${request.follower_id}`)}
                >
                  {request.profiles.username}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => handleRequest(request.id, "approved")}
                className="gap-1"
              >
                <Check className="h-4 w-4" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRequest(request.id, "rejected")}
                className="gap-1"
              >
                <X className="h-4 w-4" />
                Decline
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
