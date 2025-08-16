import { useQuery } from "@tanstack/react-query";

interface CompanyLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function CompanyLogo({ className = "", showText = true, size = "md" }: CompanyLogoProps) {
  const { data: settings } = useQuery({
    queryKey: ["/api/configuration"],
    queryFn: async () => {
      const response = await fetch('/api/configuration');
      if (!response.ok) return null;
      return response.json();
    }
  });

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {settings?.logoUrl ? (
        <img 
          src={settings.logoUrl} 
          alt={settings.companyName || "Logo"} 
          className={`${sizeClasses[size]} object-contain`}
        />
      ) : (
        <div className={`${sizeClasses[size]} bg-red-600 rounded-lg flex items-center justify-center`}>
          <span className="text-white font-bold text-sm">AC</span>
        </div>
      )}
      {showText && (
        <span className={`font-bold text-gray-900 ${textSizeClasses[size]}`}>
          {settings?.companyName || "Arriendo Cajas"}
        </span>
      )}
    </div>
  );
}