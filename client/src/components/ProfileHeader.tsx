import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ProfileHeaderProps {
  name: string;
  bio?: string;
  avatarUrl: string;
}

export default function ProfileHeader({ name, bio, avatarUrl }: ProfileHeaderProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center text-center py-12">
      <Avatar className="w-24 h-24 md:w-30 md:h-30 mb-6 ring-2 ring-border shadow-md">
        <AvatarImage src={avatarUrl} alt={name} />
        <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      <h1 className="text-2xl md:text-3xl font-bold mb-4 text-foreground" data-testid="text-profile-name">
        {name}
      </h1>
      {bio && (
        <p className="text-base text-muted-foreground max-w-md leading-relaxed px-4" data-testid="text-profile-bio">
          {bio}
        </p>
      )}
    </div>
  );
}
