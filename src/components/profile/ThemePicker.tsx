import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export const ThemePicker = () => {
  const { currentTheme, setTheme, themes } = useTheme();

  const themeOptions = [
    { key: 'default', color: 'hsl(348 100% 65%)', name: 'Neon Pink' },
    { key: 'purple', color: 'hsl(280 100% 65%)', name: 'Cyber Purple' },
    { key: 'blue', color: 'hsl(200 100% 60%)', name: 'Neon Blue' },
    { key: 'green', color: 'hsl(120 100% 50%)', name: 'Cyber Green' },
    { key: 'orange', color: 'hsl(25 100% 55%)', name: 'Neon Orange' },
  ] as const;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-gaming font-semibold text-foreground">
        Choose Your Theme
      </h3>
      <div className="grid grid-cols-5 gap-3">
        {themeOptions.map((option) => (
          <motion.button
            key={option.key}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(option.key as any)}
            className="relative aspect-square rounded-lg border-2 transition-all"
            style={{
              backgroundColor: option.color,
              borderColor: currentTheme === option.key ? option.color : 'hsl(var(--border))',
              boxShadow: currentTheme === option.key
                ? `0 0 20px ${option.color}`
                : 'none'
            }}
          >
            {currentTheme === option.key && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Check className="h-6 w-6 text-white drop-shadow-lg" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
      <div className="text-center">
        <p className="text-sm font-cyber text-muted-foreground">
          Current: <span className="text-foreground">{themes[currentTheme].name}</span>
        </p>
      </div>
    </div>
  );
};
