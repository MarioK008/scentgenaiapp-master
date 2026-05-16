import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useProfileStats } from "@/hooks/useProfileStats";
import { useBadges } from "@/hooks/useBadges";
import { useSEO } from "@/hooks/useSEO";
import { useTheme } from "next-themes";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { UserAvatar } from "@/components/UserAvatar";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { AvatarCropDialog } from "@/components/AvatarCropDialog";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2, Trash2, Lock, Star, Heart, Sparkles, Share2 } from "lucide-react";
import { ShareCollectionCard } from "@/components/ShareCollectionCard";
import { toast } from "sonner";
const Profile = () => {
  const navigate = useNavigate();
  const {
    user,
    loading: authLoading,
    signOut
  } = useAuth();

  useSEO({ 
    title: 'Profile Settings', 
    description: 'Manage your ScentGenAI profile and preferences' 
  });
  const {
    profile,
    loading: profileLoading,
    uploading,
    updateProfile,
    uploadAvatar,
    deleteAvatar
  } = useProfile();
  const {
    stats,
    loading: statsLoading
  } = useProfileStats(user?.id);
  const {
    badges,
    allBadges,
    checkBadges
  } = useBadges(user?.id);
  const {
    theme,
    setTheme
  } = useTheme();
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    location: ""
  });

  // Sync form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || "",
        bio: profile.bio || "",
        location: profile.location || ""
      });
    }
  }, [profile]);
  const [notificationSettings, setNotificationSettings] = useState(profile?.notification_settings || {
    email: true,
    newsletter: false,
    weekly_recommendations: true
  });
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [shareCardOpen, setShareCardOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>("");
  const handleAvatarUpload = async (file: File) => {
    // Create a URL for the image to crop
    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setCropDialogOpen(true);
  };
  const handleCropComplete = async (croppedBlob: Blob) => {
    await uploadAvatar(croppedBlob);
    setCropDialogOpen(false);
    URL.revokeObjectURL(imageToCrop);
    setImageToCrop("");
  };
  useEffect(() => {
    if (!authLoading && !profileLoading && (!user || !profile)) {
      navigate('/auth');
    }
  }, [user, profile, authLoading, profileLoading, navigate]);
  if (authLoading || profileLoading) {
    return <Layout>
        <div className="space-y-6 animate-pulse max-w-2xl">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-muted" />
            <div className="space-y-3 flex-1">
              <div className="h-5 w-40 bg-muted rounded" />
              <div className="h-4 w-56 bg-muted rounded" />
            </div>
          </div>
        </div>
      </Layout>;
  }
  if (!user || !profile) {
    return null;
  }
  const handleSave = async () => {
    await updateProfile({
      username: formData.username,
      bio: formData.bio,
      location: formData.location,
      notification_settings: notificationSettings
    });
  };
  const handleLanguageChange = async (language: string) => {
    await updateProfile({
      preferred_language: language
    });
  };
  const handleDarkModeToggle = async (enabled: boolean) => {
    await updateProfile({
      dark_mode_enabled: enabled
    });
    setTheme(enabled ? "dark" : "light");
  };
  const handleNotificationToggle = async (key: keyof typeof notificationSettings) => {
    const newSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key]
    };
    setNotificationSettings(newSettings);
    await updateProfile({
      notification_settings: newSettings
    });
  };
  const handlePrivacyToggle = async (isPrivate: boolean) => {
    await updateProfile({
      is_private: isPrivate
    });
    toast.success(isPrivate ? "Profile is now private" : "Profile is now public");
  };
  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { userId: user.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Account deleted");
      await signOut();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(error instanceof Error ? error.message : "Error deleting account");
    }
  };
  return <Layout>
      <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <p className="text-muted-foreground mt-3 text-lg">Manage your account settings and preferences</p>
          <Button variant="hero" onClick={() => setShareCardOpen(true)}>
            <Share2 className="h-4 w-4 mr-2" />
            Share my collection
          </Button>
        </div>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your profile details and avatar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <UserAvatar avatarUrl={profile.avatar_url} username={profile.username || profile.email} size="lg" editable onUpload={handleAvatarUpload} />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium">Profile Picture</p>
                <p className="text-sm text-muted-foreground">
                  Click on the avatar to upload a new picture. Max 2MB (JPG, PNG, WEBP)
                </p>
                {profile.avatar_url && <Button variant="destructive" size="sm" onClick={deleteAvatar}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Photo
                  </Button>}
              </div>
            </div>

            <Separator />

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={formData.username} onChange={e => setFormData({
                ...formData,
                username: e.target.value
              })} placeholder="Your username" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" value={formData.bio} onChange={e => setFormData({
                ...formData,
                bio: e.target.value
              })} placeholder="Tell us about yourself..." maxLength={200} rows={3} />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.bio.length}/200 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={formData.location} onChange={e => setFormData({
                ...formData,
                location: e.target.value
              })} placeholder="Your location" />
              </div>
            </div>

            <Button variant="premium" onClick={handleSave}>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Language</Label>
                <p className="text-sm text-muted-foreground">Select your preferred language</p>
              </div>
              <Select value={profile.preferred_language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">🇪🇸 Español</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Toggle dark mode theme</p>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={handleDarkModeToggle} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Private Profile</Label>
                <p className="text-sm text-muted-foreground">
                  Require approval before others can see your collection
                </p>
              </div>
              <Switch checked={profile.is_private || false} onCheckedChange={handlePrivacyToggle} />
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Notifications</Label>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive email updates</p>
                </div>
                <Switch checked={notificationSettings.email} onCheckedChange={() => handleNotificationToggle("email")} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Newsletter</p>
                  <p className="text-sm text-muted-foreground">Subscribe to our newsletter</p>
                </div>
                <Switch checked={notificationSettings.newsletter} onCheckedChange={() => handleNotificationToggle("newsletter")} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Weekly Recommendations</p>
                  <p className="text-sm text-muted-foreground">Get personalized perfume suggestions</p>
                </div>
                <Switch checked={notificationSettings.weekly_recommendations} onCheckedChange={() => handleNotificationToggle("weekly_recommendations")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Statistics</CardTitle>
            <CardDescription>Your perfume collection insights</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalPerfumes}</p>
                    <p className="text-sm text-muted-foreground">Total Perfumes</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.wishlistCount}</p>
                    <p className="text-sm text-muted-foreground">In Wishlist</p>
                  </div>
                </div>

                {stats.favoritePerfume && <div className="col-span-full flex items-center gap-3 p-4 rounded-lg bg-muted">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Star className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Favorite Perfume</p>
                      <p className="font-semibold">
                        {stats.favoritePerfume.brand} - {stats.favoritePerfume.name}
                      </p>
                    </div>
                    {stats.favoritePerfume.image_url && <img src={stats.favoritePerfume.image_url} alt={stats.favoritePerfume.name} className="w-16 h-16 object-cover rounded-lg" />}
                  </div>}

                {(stats.topNotes.top.length > 0 || stats.topNotes.heart.length > 0 || stats.topNotes.base.length > 0) && <div className="col-span-full p-4 rounded-lg bg-muted space-y-3">
                    <p className="text-sm font-medium">Your Top Notes</p>
                    {stats.topNotes.top.length > 0 && <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Top Notes</p>
                        <div className="flex flex-wrap gap-2">
                          {stats.topNotes.top.map(note => <span key={note} className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm">
                              {note}
                            </span>)}
                        </div>
                      </div>}
                    {stats.topNotes.heart.length > 0 && <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Heart Notes</p>
                        <div className="flex flex-wrap gap-2">
                          {stats.topNotes.heart.map(note => <span key={note} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                              {note}
                            </span>)}
                        </div>
                      </div>}
                    {stats.topNotes.base.length > 0 && <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Base Notes</p>
                        <div className="flex flex-wrap gap-2">
                          {stats.topNotes.base.map(note => <span key={note} className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm">
                              {note}
                            </span>)}
                        </div>
                      </div>}
                  </div>}
              </div>}
          </CardContent>
        </Card>

        {/* Badges */}
        <BadgeDisplay badges={allBadges.map(badge => {
        const earnedBadge = badges.find(b => b.badges.id === badge.id);
        return {
          ...badge,
          earned: badge.earned,
          earned_at: earnedBadge?.earned_at
        };
      })} title="Achievements" description="Track your progress and earn badges" showProgress={true} />

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Password</Label>
                <p className="text-sm text-muted-foreground">Change your password</p>
              </div>
              <Button variant="outline" onClick={() => setChangePasswordDialogOpen(true)}>
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sign Out</Label>
                <p className="text-sm text-muted-foreground">Sign out of your account</p>
              </div>
              <Button variant="secondary" onClick={signOut}>
                Sign Out
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-destructive">Delete Account</Label>
                <p className="text-sm text-muted-foreground">Permanently delete your account</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive">
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        <ChangePasswordDialog open={changePasswordDialogOpen} onOpenChange={setChangePasswordDialogOpen} userEmail={profile.email} />

        <AvatarCropDialog open={cropDialogOpen} onOpenChange={open => {
        setCropDialogOpen(open);
        if (!open && imageToCrop) {
          URL.revokeObjectURL(imageToCrop);
          setImageToCrop("");
        }
      }} imageUrl={imageToCrop} onCropComplete={handleCropComplete} loading={uploading} />

        <ShareCollectionCard
          isOpen={shareCardOpen}
          onClose={() => setShareCardOpen(false)}
          userId={user.id}
          username={profile.username || profile.email.split("@")[0]}
          avatarUrl={profile.avatar_url}
        />
      </div>
    </Layout>;
};
export default Profile;