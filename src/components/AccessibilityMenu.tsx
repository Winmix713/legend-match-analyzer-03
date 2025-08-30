import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Accessibility, 
  Eye, 
  Keyboard, 
  Volume2, 
  MousePointer, 
  Type,
  Palette,
  Zap
} from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { applyAccessibilitySettings, type AccessibilityOptions } from '@/lib/accessibility-utils';
import { cn } from '@/lib/utils';

interface AccessibilityMenuProps {
  className?: string;
}

interface AccessibilityPreset {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  settings: AccessibilityOptions & {
    fontSize: number;
    keyboardNavigation: boolean;
    screenReaderAnnouncements: boolean;
  };
}

const presets: AccessibilityPreset[] = [
  {
    name: 'Visual Impairment',
    description: 'High contrast, larger text, screen reader optimized',
    icon: Eye,
    settings: {
      highContrast: true,
      largerText: true,
      screenReaderOptimized: true,
      fontSize: 18,
      keyboardNavigation: true,
      screenReaderAnnouncements: true,
    },
  },
  {
    name: 'Motor Impairment',
    description: 'Enhanced keyboard navigation and reduced motion',
    icon: MousePointer,
    settings: {
      reducedMotion: true,
      largerText: true,
      fontSize: 16,
      keyboardNavigation: true,
      screenReaderAnnouncements: false,
    },
  },
  {
    name: 'Cognitive Support',
    description: 'Dyslexia-friendly fonts and reduced motion',
    icon: Type,
    settings: {
      dyslexiaFriendly: true,
      reducedMotion: true,
      largerText: true,
      fontSize: 16,
      keyboardNavigation: true,
      screenReaderAnnouncements: true,
    },
  },
];

export function AccessibilityMenu({ className }: AccessibilityMenuProps) {
  const [settings, setSettings] = useLocalStorage('accessibility-settings', {
    highContrast: false,
    reducedMotion: false,
    largerText: false,
    dyslexiaFriendly: false,
    screenReaderOptimized: false,
    fontSize: 14,
    keyboardNavigation: false,
    screenReaderAnnouncements: false,
  }, 1);

  const updateSetting = <K extends keyof typeof settings>(
    key: K,
    value: typeof settings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Apply accessibility settings to DOM
    applyAccessibilitySettings({
      highContrast: newSettings.highContrast,
      reducedMotion: newSettings.reducedMotion,
      largerText: newSettings.largerText,
      dyslexiaFriendly: newSettings.dyslexiaFriendly,
      screenReaderOptimized: newSettings.screenReaderOptimized,
    });

    // Apply font size
    if (key === 'fontSize') {
      document.documentElement.style.fontSize = `${value}px`;
    }
  };

  const applyPreset = (preset: AccessibilityPreset) => {
    const newSettings = { 
      ...settings,
      ...preset.settings 
    };
    setSettings(newSettings);
    
    applyAccessibilitySettings({
      highContrast: newSettings.highContrast,
      reducedMotion: newSettings.reducedMotion,
      largerText: newSettings.largerText,
      dyslexiaFriendly: newSettings.dyslexiaFriendly,
      screenReaderOptimized: newSettings.screenReaderOptimized,
    });

    document.documentElement.style.fontSize = `${newSettings.fontSize}px`;
  };

  const resetSettings = () => {
    const defaultSettings = {
      highContrast: false,
      reducedMotion: false,
      largerText: false,
      dyslexiaFriendly: false,
      screenReaderOptimized: false,
      fontSize: 14,
      keyboardNavigation: false,
      screenReaderAnnouncements: false,
    };
    
    setSettings(defaultSettings);
    applyAccessibilitySettings(defaultSettings);
    document.documentElement.style.fontSize = '14px';
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className={cn('gap-2', className)}
          aria-label="Open accessibility settings"
        >
          <Accessibility className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Accessibility</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Accessibility className="h-5 w-5" />
            Accessibility Settings
          </DialogTitle>
          <DialogDescription>
            Customize your experience with accessibility features designed to help everyone use this application effectively.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Presets */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quick Presets
            </h3>
            <div className="grid gap-3">
              {presets.map((preset) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                  >
                    <Icon className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {preset.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Visual Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Visual Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="high-contrast">High Contrast Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Increases contrast for better visibility
                  </p>
                </div>
                <Switch
                  id="high-contrast"
                  checked={settings.highContrast}
                  onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="larger-text">Larger Text</Label>
                  <p className="text-sm text-muted-foreground">
                    Increase default text size across the application
                  </p>
                </div>
                <Switch
                  id="larger-text"
                  checked={settings.largerText}
                  onCheckedChange={(checked) => updateSetting('largerText', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-size">
                  Font Size: {settings.fontSize}px
                </Label>
                <Slider
                  id="font-size"
                  min={12}
                  max={24}
                  step={1}
                  value={[settings.fontSize]}
                  onValueChange={([value]) => updateSetting('fontSize', value)}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dyslexia-friendly">Dyslexia-Friendly Font</Label>
                  <p className="text-sm text-muted-foreground">
                    Use fonts optimized for dyslexic users
                  </p>
                </div>
                <Switch
                  id="dyslexia-friendly"
                  checked={settings.dyslexiaFriendly}
                  onCheckedChange={(checked) => updateSetting('dyslexiaFriendly', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Motion Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              Motion & Interaction
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reduced-motion">Reduced Motion</Label>
                  <p className="text-sm text-muted-foreground">
                    Minimize animations and transitions
                  </p>
                </div>
                <Switch
                  id="reduced-motion"
                  checked={settings.reducedMotion}
                  onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="keyboard-navigation">Enhanced Keyboard Navigation</Label>
                  <p className="text-sm text-muted-foreground">
                    Improve keyboard accessibility and focus indicators
                  </p>
                </div>
                <Switch
                  id="keyboard-navigation"
                  checked={settings.keyboardNavigation}
                  onCheckedChange={(checked) => updateSetting('keyboardNavigation', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Screen Reader Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Screen Reader Support
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="screen-reader-optimized">Screen Reader Optimized</Label>
                  <p className="text-sm text-muted-foreground">
                    Optimize interface for screen readers
                  </p>
                </div>
                <Switch
                  id="screen-reader-optimized"
                  checked={settings.screenReaderOptimized}
                  onCheckedChange={(checked) => updateSetting('screenReaderOptimized', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="screen-reader-announcements">Live Announcements</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable audio announcements for important changes
                  </p>
                </div>
                <Switch
                  id="screen-reader-announcements"
                  checked={settings.screenReaderAnnouncements}
                  onCheckedChange={(checked) => updateSetting('screenReaderAnnouncements', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Reset Button */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Reset Settings</h4>
              <p className="text-sm text-muted-foreground">
                Restore all accessibility settings to default values
              </p>
            </div>
            <Button variant="outline" onClick={resetSettings}>
              Reset All
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}