import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

interface TourStep {
  target: string; // CSS selector for the element to highlight
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  clickBefore?: string; // CSS selector of element to click before showing this step
}

export type { TourStep };

interface GuidedTourProps {
  tourId: string; // Unique ID for localStorage
  steps: TourStep[];
  onComplete?: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

// Check if we're on mobile
const isMobile = () => window.innerWidth < 768;

export default function GuidedTour({ tourId, steps, onComplete }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Find and highlight the target element
  const updateTargetPosition = useCallback(() => {
    if (!step?.target) return;

    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      // Use viewport-relative coordinates (fixed positioning)
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });

      // Scroll element into view if needed (only if not fully visible)
      const isFullyVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
      if (!isFullyVisible) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetRect(null);
    }
  }, [step?.target]);

  // Click on element before showing step (e.g., to switch tabs)
  useEffect(() => {
    if (step?.clickBefore) {
      const elementToClick = document.querySelector(step.clickBefore) as HTMLElement;
      if (elementToClick) {
        elementToClick.click();
      }
    }
  }, [step?.clickBefore, currentStep]);

  useEffect(() => {
    // Delay to let the DOM update after clicking on tab
    const delay = step?.clickBefore ? 300 : 0;
    const timer = setTimeout(() => {
      updateTargetPosition();
    }, delay);

    // Update position on resize/scroll
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition);
    };
  }, [updateTargetPosition, currentStep, step?.clickBefore]);

  // Retry finding element after a short delay (for dynamic content)
  useEffect(() => {
    const timer = setTimeout(updateTargetPosition, 400);
    return () => clearTimeout(timer);
  }, [currentStep, updateTargetPosition]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(`tour_${tourId}_completed`, 'true');
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem(`tour_${tourId}_completed`, 'true');
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible) return null;

  // Calculate tooltip position with viewport boundary checking
  const getTooltipStyle = (): React.CSSProperties => {
    const mobile = isMobile();
    const padding = mobile ? 12 : 16;
    const tooltipWidth = mobile ? Math.min(280, window.innerWidth - padding * 2) : 320;
    const tooltipHeight = 200; // Approximate height

    if (!targetRect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: tooltipWidth,
        maxWidth: `calc(100vw - ${padding * 2}px)`,
      };
    }

    const position = step.position || 'bottom';

    // Calculate safe left position (always within viewport)
    const safeLeft = Math.min(
      Math.max(padding, targetRect.left + targetRect.width / 2 - tooltipWidth / 2),
      window.innerWidth - tooltipWidth - padding
    );

    // Calculate safe top position
    const safeTop = Math.min(
      Math.max(padding, targetRect.top + targetRect.height / 2 - tooltipHeight / 2),
      window.innerHeight - tooltipHeight - padding
    );

    // On mobile, prefer bottom position and use fixed positioning
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      width: tooltipWidth,
      maxWidth: `calc(100vw - ${padding * 2}px)`,
    };

    // On mobile, always position below if there's space, otherwise above
    if (mobile) {
      const spaceBelow = window.innerHeight - (targetRect.top + targetRect.height);
      const spaceAbove = targetRect.top;

      if (spaceBelow >= tooltipHeight + padding) {
        return {
          ...baseStyle,
          top: targetRect.top + targetRect.height + padding,
          left: safeLeft,
        };
      } else if (spaceAbove >= tooltipHeight + padding) {
        return {
          ...baseStyle,
          top: targetRect.top - tooltipHeight - padding,
          left: safeLeft,
        };
      } else {
        // Not enough space above or below, center in viewport
        return {
          ...baseStyle,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
      }
    }

    // Desktop positioning
    switch (position) {
      case 'top':
        return {
          ...baseStyle,
          top: Math.max(padding, targetRect.top - padding - 8 - tooltipHeight),
          left: safeLeft,
        };
      case 'bottom':
        return {
          ...baseStyle,
          top: targetRect.top + targetRect.height + padding,
          left: safeLeft,
        };
      case 'left': {
        const leftSpace = targetRect.left - padding;
        if (leftSpace >= tooltipWidth) {
          return {
            ...baseStyle,
            top: safeTop,
            left: targetRect.left - padding - tooltipWidth,
          };
        }
        return {
          ...baseStyle,
          top: targetRect.top + targetRect.height + padding,
          left: safeLeft,
        };
      }
      case 'right': {
        const rightSpace = window.innerWidth - (targetRect.left + targetRect.width) - padding;
        if (rightSpace >= tooltipWidth) {
          return {
            ...baseStyle,
            top: safeTop,
            left: targetRect.left + targetRect.width + padding,
          };
        }
        return {
          ...baseStyle,
          top: targetRect.top + targetRect.height + padding,
          left: safeLeft,
        };
      }
      default:
        return {
          ...baseStyle,
          top: targetRect.top + targetRect.height + padding,
          left: safeLeft,
        };
    }
  };

  // Calculate spotlight dimensions with minimum size for small elements
  const getSpotlightRect = () => {
    if (!targetRect) return null;

    const minSize = 48; // Minimum spotlight size
    const padding = 12;

    let width = targetRect.width + padding * 2;
    let height = targetRect.height + padding * 2;
    let left = targetRect.left - padding;
    let top = targetRect.top - padding;

    // Ensure minimum size and center on target
    if (width < minSize) {
      left = targetRect.left + targetRect.width / 2 - minSize / 2;
      width = minSize;
    }
    if (height < minSize) {
      top = targetRect.top + targetRect.height / 2 - minSize / 2;
      height = minSize;
    }

    return { left, top, width, height };
  };

  const spotlightRect = getSpotlightRect();

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Dark overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.left}
                y={spotlightRect.top}
                width={spotlightRect.width}
                height={spotlightRect.height}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Spotlight border/glow effect with pulse animation */}
      {spotlightRect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: 1,
            scale: 1,
            boxShadow: [
              '0 0 20px rgba(250, 204, 21, 0.5)',
              '0 0 40px rgba(250, 204, 21, 0.8)',
              '0 0 20px rgba(250, 204, 21, 0.5)',
            ]
          }}
          transition={{
            boxShadow: {
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          }}
          className="fixed pointer-events-none"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
            borderRadius: 12,
            border: '3px solid #facc15',
          }}
        />
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          style={getTooltipStyle()}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-white" />
              <span className="text-white font-semibold text-sm">
                Étape {currentStep + 1}/{steps.length}
              </span>
            </div>
            <button
              onClick={handleSkip}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
          </div>

          {/* Navigation */}
          <div className="px-4 pb-4 flex items-center gap-2">
            {!isFirstStep && (
              <button
                onClick={handlePrev}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-semibold rounded-xl hover:from-yellow-500 hover:to-amber-600 transition-all"
            >
              {isLastStep ? (
                <>
                  <span>Terminer</span>
                  <Sparkles className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Suivant</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Skip link */}
          <div className="px-4 pb-3 text-center">
            <button
              onClick={handleSkip}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Passer le tutoriel
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Helper to check if tour should be shown
export function shouldShowTour(tourId: string): boolean {
  return localStorage.getItem(`tour_${tourId}_completed`) !== 'true';
}

// Helper to reset tour (for testing)
export function resetTour(tourId: string): void {
  localStorage.removeItem(`tour_${tourId}_completed`);
}

// Helper to reset all tours
export function resetAllTours(): void {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('tour_')) {
      localStorage.removeItem(key);
    }
  });
}
