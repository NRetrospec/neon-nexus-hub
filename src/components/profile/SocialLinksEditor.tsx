import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SocialLink {
  platform: string;
  url: string;
  icon?: string;
}

interface SocialLinksEditorProps {
  links: SocialLink[];
  onChange: (links: SocialLink[]) => void;
  isEditing: boolean;
}

const PLATFORMS = [
  { value: 'discord', label: 'Discord', icon: '💬' },
  { value: 'twitch', label: 'Twitch', icon: '🎮' },
  { value: 'youtube', label: 'YouTube', icon: '📺' },
  { value: 'twitter', label: 'Twitter/X', icon: '🐦' },
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'github', label: 'GitHub', icon: '💻' },
  { value: 'website', label: 'Website', icon: '🌐' },
  { value: 'other', label: 'Other', icon: '🔗' },
];

export const SocialLinksEditor = ({ links, onChange, isEditing }: SocialLinksEditorProps) => {
  const addLink = () => {
    if (links.length >= 5) return;
    onChange([...links, { platform: 'discord', url: '', icon: '💬' }]);
  };

  const updateLink = (index: number, field: keyof SocialLink, value: string) => {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-update icon when platform changes
    if (field === 'platform') {
      const platform = PLATFORMS.find(p => p.value === value);
      if (platform) {
        updated[index].icon = platform.icon;
      }
    }

    onChange(updated);
  };

  const removeLink = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-gaming font-semibold text-foreground">
          Social Links ({links.length}/5)
        </h3>
        {isEditing && links.length < 5 && (
          <Button
            variant="cyber"
            size="sm"
            onClick={addLink}
            className="font-gaming"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Link
          </Button>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {links.map((link, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="gaming-card p-4 space-y-3"
          >
            {isEditing ? (
              <>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="font-cyber text-sm">Platform</Label>
                    <Select
                      value={link.platform}
                      onValueChange={(value) => updateLink(index, 'platform', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map((platform) => (
                          <SelectItem key={platform.value} value={platform.value}>
                            {platform.icon} {platform.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLink(index)}
                    className="text-destructive hover:text-destructive/80 mt-6"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div>
                  <Label className="font-cyber text-sm">URL</Label>
                  <Input
                    value={link.url}
                    onChange={(e) => updateLink(index, 'url', e.target.value)}
                    placeholder="https://..."
                    className="font-cyber"
                  />
                </div>
              </>
            ) : (
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:text-primary transition-colors"
              >
                <span className="text-2xl">{link.icon}</span>
                <div className="flex-1">
                  <p className="font-gaming text-sm font-semibold text-foreground">
                    {PLATFORMS.find(p => p.value === link.platform)?.label || link.platform}
                  </p>
                  <p className="text-xs text-muted-foreground font-cyber truncate">
                    {link.url}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {links.length === 0 && (
        <div className="text-center py-8 text-muted-foreground font-cyber text-sm">
          No social links added yet
        </div>
      )}
    </div>
  );
};
