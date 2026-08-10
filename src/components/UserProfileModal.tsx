import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserProfile } from '@/types/fitness';
import { User } from 'lucide-react';

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
  initialProfile: UserProfile;
}

const AVATAR_OPTIONS = ['👤', '🏃', '💪', '🧘', '🏋️', '⚡', '🔥', '🌟'];

export function UserProfileModal({ open, onClose, onSave, initialProfile }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);

  const handleSave = () => {
    onSave(profile);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="w-5 h-5 text-primary" />
            Your Profile
          </DialogTitle>
          <DialogDescription>
            Enter your details for accurate calorie tracking
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Avatar Selection */}
          <div className="space-y-2">
            <Label>Choose Avatar</Label>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setProfile({ ...profile, avatar: emoji })}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                    profile.avatar === emoji 
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background' 
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Your name"
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              value={profile.weight}
              onChange={(e) => setProfile({ ...profile, weight: Number(e.target.value) })}
              placeholder="70"
              className="bg-secondary border-border"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              value={profile.height}
              onChange={(e) => setProfile({ ...profile, height: Number(e.target.value) })}
              placeholder="175"
              className="bg-secondary border-border"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="age">Age (years)</Label>
            <Input
              id="age"
              type="number"
              value={profile.age}
              onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
              placeholder="25"
              className="bg-secondary border-border"
            />
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
