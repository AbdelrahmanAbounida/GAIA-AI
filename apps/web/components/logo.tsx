import { cn } from "@/lib/utils";
import Image from "next/image";
import LogoImage from "@/public/logos/logo.png";
import { useRouter } from "next/navigation";

export const Logo = ({
  className,
  isIcon = false,
  width,
  height,
  clickable = true,
  isLink = true,
}: {
  className?: string;
  isIcon?: boolean;
  width?: number;
  height?: number;
  clickable?: boolean;
  isLink?: boolean;
}) => {
  const router = useRouter();

  const content = (
    <div className=" relative  pr-2 hover:bg-transparent!  bg-transparent! flex items-center justify-center text-center">
      <Image
        src={LogoImage}
        alt="gaia"
        width={width || 100}
        height={height || 100}
        className={cn("size-8  bg-transparent!", isIcon && "ml-0", className)}
      />
      {!isIcon && (
        <span className="text-3xl font-bold text-foreground">AIA</span>
      )}
    </div>
  );

  // Clickable logo
  return (
    <div
      onClick={() => {
        if (isLink) router.push("/");
      }}
      className={cn(
        "flex items-center bg-transparent! cursor-pointer select-none w-full",
        !clickable && "cursor-default",
        className
      )}
    >
      {content}
    </div>
  );
};
